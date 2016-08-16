export abstract class Type{

  abstract hasChildren(): boolean

  constructor(){
  }


  abstract validate(item: any,callback: { (err: Object, res: Object): void },path: string);


  abstract toJSON();

  getDefault(): any{
    return null;
  }


}
