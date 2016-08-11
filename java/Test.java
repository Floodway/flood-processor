
        /*
        * This class was automatically generate by Floodway.
        */
        class Test{
            
public static class TestResult{private long time;public void setTime(long time){this.time = time; }public long getTime(){ return this.time; }}
            
            
            public abstract static class TestCallback{
                abstract void result(TestResult result);
                abstract void err(String errorCode,String description);
            }
            
            public static Request test(Foo.NoParams params,final TestCallback callback){
                return new Request("test","test",params,new Request.RequestCallback(TestResult.class){
                    @Override
                    public void res(Object result){
                        callback.result((TestResult) result);
                    }
                    @Override
                    public void err(String ec,String desc){
                        callback.err(ec,desc);
                    }
                });
            }
        
        }
    