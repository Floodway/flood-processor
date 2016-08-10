import * as chalk from "chalk";


/**
 * Log
 */

export enum Output{
    Out,Error
}

export class Log {
    
    private key: string;
    
    constructor(key: string) {
        this.key = key;
    }

    getTime(){
        var date = new Date();
        return "["+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds()+"][ "+this.key+" ]: ";

    }

    log(data: string){
        Log.print(chalk.blue(this.getTime())+data,Output.Out);
    }
    
    debug(data: string){
        this.log(data);
    }
    
    success(data: string){
        Log.print(chalk.green(this.getTime())+data,Output.Out);
    }

    error(data: string){
        Log.print(chalk.red(this.getTime())+data,Output.Error);
    }
    
    static print(message: String,output: Output){
        switch(output){

            case Output.Out:
                console.log(message);
                break;

            case Output.Error:
                console.error(message);
                break;

        }
    }

}
