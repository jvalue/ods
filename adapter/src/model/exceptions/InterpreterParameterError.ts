import { AdapterError } from "./AdapterError";

export class InterpreterParameterError extends AdapterError{

    constructor(msg: string){
        super(msg);
    }
}