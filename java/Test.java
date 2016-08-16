
        package se.kth.clickr;
        import java.util.List;
        
        /*
        * This class was automatically generated by Floodway.
        */
        class Test{
            
public static class Meta{private String foo;private String bar;public void setFoo(String foo){this.foo = foo; }public String getFoo(){ return this.foo; }public void setBar(String bar){this.bar = bar; }public String getBar(){ return this.bar; }}
public static class TestChild{private Meta meta;private String bar;public void setMeta(Meta meta){this.meta = meta; }public Meta getMeta(){ return this.meta; }public void setBar(String bar){this.bar = bar; }public String getBar(){ return this.bar; }}
public static class TestParamms{private List<TestChild> items;public void setItems(List<TestChild> items){this.items = items; }public List<TestChild> getItems(){ return this.items; }}
public static class TestActionResult{private long time;public void setTime(long time){this.time = time; }public long getTime(){ return this.time; }}
public static class NoParams{}
public static class FilePath{private String path;public void setPath(String path){this.path = path; }public String getPath(){ return this.path; }}
public static class File{private String fieldname;private String originalname;private String encoding;private String mimetype;private String destination;private String filename;private String path;private long size;public void setFieldname(String fieldname){this.fieldname = fieldname; }public String getFieldname(){ return this.fieldname; }public void setOriginalname(String originalname){this.originalname = originalname; }public String getOriginalname(){ return this.originalname; }public void setEncoding(String encoding){this.encoding = encoding; }public String getEncoding(){ return this.encoding; }public void setMimetype(String mimetype){this.mimetype = mimetype; }public String getMimetype(){ return this.mimetype; }public void setDestination(String destination){this.destination = destination; }public String getDestination(){ return this.destination; }public void setFilename(String filename){this.filename = filename; }public String getFilename(){ return this.filename; }public void setPath(String path){this.path = path; }public String getPath(){ return this.path; }public void setSize(long size){this.size = size; }public long getSize(){ return this.size; }}
public static class ExampleUploadParams{private File file;public void setFile(File file){this.file = file; }public File getFile(){ return this.file; }}
public static class NoRes{}
            
            
            public abstract static class TestCallback{
                abstract void result(TestActionResult result);
                abstract void err(String errorCode,String description);
            }
            
            public static Request test(TestParamms params,final TestCallback callback){
                return new Request("test","test",params,new Request.RequestCallback(TestActionResult.class){
                    @Override
                    public void res(Object result){
                        callback.result((TestActionResult) result);
                    }
                    @Override
                    public void err(String ec,String desc){
                        callback.err(ec,desc);
                    }
                });
            }
        
            
            public abstract static class DownloadCallback{
                abstract void result(FilePath result);
                abstract void err(String errorCode,String description);
            }
            
            public static Request download(NoParams params,final DownloadCallback callback){
                return new Request("test","download",params,new Request.RequestCallback(FilePath.class){
                    @Override
                    public void res(Object result){
                        callback.result((FilePath) result);
                    }
                    @Override
                    public void err(String ec,String desc){
                        callback.err(ec,desc);
                    }
                });
            }
        
            
            public abstract static class UploadCallback{
                abstract void result(NoRes result);
                abstract void err(String errorCode,String description);
            }
            
            public static Request upload(ExampleUploadParams params,final UploadCallback callback){
                return new Request("test","upload",params,new Request.RequestCallback(NoRes.class){
                    @Override
                    public void res(Object result){
                        callback.result((NoRes) result);
                    }
                    @Override
                    public void err(String ec,String desc){
                        callback.err(ec,desc);
                    }
                });
            }
        
        }
    