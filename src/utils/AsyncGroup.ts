
export interface AsyncGroupCallback{
    (err: any,res: any): void
}

export interface Runnable{
    (done: AsyncGroupCallback): void
}

export class AsyncGroup{

    private callback: AsyncGroupCallback;
    private runnables:  Runnable[];

    private failed = false;
    private lastError: any;
    private breakOnError: boolean;

    constructor(callback: AsyncGroupCallback,breakOnError: boolean = true)  {
        this.callback = callback;
        this.runnables = [];
        this.breakOnError = breakOnError;
    }

    add(runnable: Runnable): AsyncGroup{
        this.runnables.push(runnable);
        return this;
    }

    run(){
        this.failed = false;
        let done = 0;
        let results = [];

        if(this.runnables.length == 0 ){
            return this.callback(null,results);
        }

        let runNext =  () => {



            let current: Runnable = this.runnables[done];


            current((err: any,res: any) =>{
              if(err != null){
                  if(this.breakOnError){
                      this.callback(err,null);
                      return;
                  }else{
                      results.push(err);
                  }
              }else{
                  results.push(res);
              }

              done++;
              if(done == this.runnables.length){
                  this.callback(null,results);
              }else{
                  runNext();
              }

            });
        };

        runNext();
    }


}