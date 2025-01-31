import { Component, OnInit } from '@angular/core';
import { from, map, of, tap } from 'rxjs';

@Component({
  selector: 'app-page-not-found',
  templateUrl: './page-not-found.component.html',
  styleUrls: ['./page-not-found.component.scss']
})
export class PageNotFoundComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {

    // of
    const person = {
      name:"Kalyani"
    }
    const personObs = of(person);
    personObs.subscribe((data) => {
      console.log(data); // {name : "Kalyani"}
    });

    // from
    const personPromise = Promise.resolve(person);
    const personPromiseObs = from(personPromise); // to convert a promise into a observable
    personPromiseObs.subscribe( (data) => {
      console.log(data); // {name : "Kalyani"}
    });

    const source = of('kalyani');
    // map
    source.pipe(map((val)=>{
      return val.toUpperCase();
    })).subscribe((data)=>{
      console.log(data); // KALYANI
    })

    // tap
    source.pipe(tap(val => {
      return val.toUpperCase()
    })).subscribe(data => {
      console.log(data); // kalyani
    })

  }

}
