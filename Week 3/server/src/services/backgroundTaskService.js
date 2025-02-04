const knex = require('../mysql/knex');
const XLSX = require('xlsx');
const cron = require('node-cron');
const { s3Client } = require('../aws/s3/s3');
const { GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const ExcelJS = require('exceljs');

class BackgroundTaskService {
  constructor() {
    // Initialize cron job
    this.initCronJob();
  }

   // Rename setIo to setSocketIO to match the call in server.js
   setSocketIO(io) {
    this.io = io;
    console.log('Socket.IO instance set in BackgroundTaskService');
  }

  initCronJob() {
    // Run every 10 minutes
    cron.schedule('*/10 * * * *', async () => {
      await this.processUploadedFiles();
    });
  }

  async processUploadedFiles() {
    const pendingFiles = await knex('file_uploads')
      .where('status', 'pending')
      .orderBy('created_at', 'asc');

    for (const file of pendingFiles) {
      await this.processFile(file);
    }
  }

  async processFile(fileUpload) {
    try {
      console.log(`Starting to process file: ${fileUpload.file_name}`);
      
      if (this.io) {
        this.io.emit('fileProcessing', {
          fileId: fileUpload.id,
          fileName: fileUpload.file_name,
          status: 'processing',
          message: `Started processing ${fileUpload.file_name}`
        });
      }

      await knex('file_uploads')
        .where('id', fileUpload.id)
        .update({ 
          status: 'processing',
          error_message: null
        });

      // Get file from S3
      console.log('Fetching file from S3...');
      const s3Object = await s3Client.send(new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileUpload.file_key
      }));

      // Initialize ExcelJS workbook and use stream reader
      const workbook = new ExcelJS.Workbook();
      const successfulRecords = [];
      const failedRecords = [];
      let totalRows = 0;
      let processedRows = 0;

      await new Promise((resolve, reject) => {
        workbook.xlsx.read(s3Object.Body)
          .then(async () => {
            const worksheet = workbook.getWorksheet(1);
            if (!worksheet) {
              throw new Error('First worksheet is empty or invalid');
            }

            totalRows = worksheet.rowCount - 1; // Subtract header row
            const headers = worksheet.getRow(1).values.slice(1); // Get headers, skip first empty cell

            // Process rows using worksheet.eachRow
            for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
              const row = worksheet.getRow(rowNumber);
              const rowData = {};
              
              // Convert row to object using header as keys
              row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                const header = headers[colNumber - 1];
                rowData[header] = cell.value || '';
              });

              try {
                const result = await this.processRecord(rowData, fileUpload.user_id);
                
                if (result.success) {
                  successfulRecords.push(rowData);
                } else {
                  failedRecords.push({
                    ...rowData,
                    Error_Message: result.error
                  });
                }

                processedRows++;
                
                // Emit progress update every 100 rows or on the last row
                if (this.io && (processedRows % 100 === 0 || processedRows === totalRows)) {
                  const progress = Math.round((processedRows / totalRows) * 100);
                  this.io.emit('fileProgress', {
                    fileId: fileUpload.id,
                    fileName: fileUpload.file_name,
                    progress,
                    message: `Processing record ${processedRows} of ${totalRows}`
                  });
                }
              } catch (error) {
                console.error('Error processing row:', rowNumber, error);
                failedRecords.push({
                  ...rowData,
                  Error_Message: error.message
                });
              }
            }
            resolve();
          })
          .catch(reject);
      });

      // Generate error sheet if there are failed records
      let errorFileKey = null;
      if (failedRecords.length > 0) {
        console.log('Generating error sheet...');
        errorFileKey = await this.generateErrorSheet(failedRecords, fileUpload.id);
      }

      // Update final status
      const errorMessage = failedRecords.length > 0 
        ? `Processing completed. ${failedRecords.length} records had errors. Download error sheet for details.`
        : null;

      await knex('file_uploads')
        .where('id', fileUpload.id)
        .update({
          status: 'completed',
          processed_count: successfulRecords.length,
          error_count: failedRecords.length,
          error_file_key: errorFileKey,
          error_message: errorMessage,
          completed_at: new Date()
        });

      // Emit completion event
      if (this.io) {
        this.io.emit('fileProcessingComplete', {
          fileId: fileUpload.id,
          fileName: fileUpload.file_name,
          status: 'completed',
          processedCount: successfulRecords.length,
          errorCount: failedRecords.length,
          errorMessage: errorMessage
        });
      }

    } catch (error) {
      console.error('Critical error processing file:', {
        fileId: fileUpload.id,
        fileName: fileUpload.file_name,
        error: {
          message: error.message,
          stack: error.stack
        }
      });
      
      await knex('file_uploads')
        .where('id', fileUpload.id)
        .update({
          status: 'failed',
          error_message: error.message || 'An unknown error occurred while processing the file',
          completed_at: new Date()
        });

      if (this.io) {
        this.io.emit('fileProcessingError', {
          fileId: fileUpload.id,
          fileName: fileUpload.file_name,
          status: 'failed',
          error: error.message || 'An unknown error occurred while processing the file'
        });
      }
    }
  }

  async processRecord(record, userId) {
    const errors = [];
    const trx = await knex.transaction();
    
    try {
      // Validation checks
      const productName = record.productName || record['Product Name'];
      const category = record.category || record['Category'];
      const vendors = record.vendors || record['Vendors'];
      const quantity = record.quantity || record['Quantity'];
      const unit = record.unit || record['Unit'];

      // Collect validation errors
      if (!productName) errors.push('Product name is required');
      if (!category) errors.push('Category is required');
      if (!vendors) errors.push('Vendors are required');
      if (quantity === undefined || quantity === '') errors.push('Quantity is required');
      if (!unit) errors.push('Unit is required');
      if (quantity !== undefined && (isNaN(Number(quantity)) || Number(quantity) < 0)) {
        errors.push('Quantity must be a non-negative number');
      }

      // If validation errors exist, throw early
      if (errors.length > 0) {
        throw new Error(errors.join(', '));
      }

      // Process the record if validation passed
      // Check category exists
      const [categoryRecord] = await trx('categories')
        .select('category_id')
        .where('category_name', category);

      if (!categoryRecord) {
        errors.push(`Invalid category: ${category}`);
      }

      // Process vendors
      const vendorNames = typeof vendors === 'string' 
        ? vendors.split(',').map(v => v.trim())
        : Array.isArray(vendors) ? vendors : [];

      const vendorIds = await trx('vendors')
        .select('vendor_id')
        .whereIn('vendor_name', vendorNames);

      if (vendorIds.length !== vendorNames.length) {
        errors.push(`Invalid Vendor : invalid vendor found`);
      }

      if(errors.length>0){
        console.log("errrors : ",errors);
        throw new Error(errors.join(', '));
      }

      // Insert product
      const [productId] = await trx('products')
        .insert({
          product_name: productName,
          category_id: categoryRecord.category_id,
          quantity_in_stock: Number(quantity),
          unit: unit,
          status: 1,
          created_at: new Date(),
          updated_at: new Date(),
        });

      // Insert product-vendor relationships
      await trx('product_to_vendor')
        .insert(vendorIds.map(({ vendor_id }) => ({
          product_id: productId,
          vendor_id: vendor_id,
          created_at: new Date(),
          updated_at: new Date()
        })));

      await trx.commit();
      return { success: true };
    } catch (error) {
      await trx.rollback();
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  async generateErrorSheet(invalidRecords, fileId) {
    try {
      console.log('Creating error sheet workbook...');
      const workbook = XLSX.utils.book_new();
      
      // Format records for error sheet - keep original columns plus error message
      const recordsWithErrors = invalidRecords.map(({ Error_Message, errors, ...record }) => ({
        ...record,
        Error_Message: Error_Message || errors // Use the new column name consistently
      }));

      console.log('Converting error records to worksheet...');
      const worksheet = XLSX.utils.json_to_sheet(recordsWithErrors);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Invalid Records');

      // Adjust column width for error message column
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      const errorColIndex = Object.keys(recordsWithErrors[0]).length - 1; // Error_Message is last column
      worksheet['!cols'] = Array(range.e.c + 1).fill({ wch: 12 }); // Default width
      worksheet['!cols'][errorColIndex] = { wch: 50 }; // Make error column wider

      console.log('Writing error sheet to buffer...');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      const errorFileKey = `error-sheets/${fileId}_errors.xlsx`;

      console.log('Uploading error sheet to S3...');
      await s3Client.send(new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: errorFileKey,
        Body: buffer,
        ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }));

      console.log('Error sheet generated successfully');
      return errorFileKey;
    } catch (error) {
      console.error('Error generating error sheet:', error);
      throw error;
    }
  }
}

module.exports = new BackgroundTaskService(); 