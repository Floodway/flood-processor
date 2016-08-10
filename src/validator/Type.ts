export abstract class Type{

  public path: string;

  private isBuiltB: boolean;

  abstract hasChildren(): boolean

  constructor(){
    this.isBuiltB = false;
  }

  isBuilt(){
    return this.isBuiltB;
  }

  abstract validate(item: any,callback: { (err: Object, res: Object): void });

  build(path: string = "root"): Type{
    this.path = path;
    this.isBuiltB = true;
    return this;
  }

  abstract toJSON();

  getDefault(): any{
    return null;
  }


}

// Exampleschema
/*
schema = new ObjectSchema()
  .mode("strict")
  .children({
    name: new StringSchema().length(3)

  })
  .build()
  */
