import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import java.util.UUID;

public class Request{
    public String messageType = "request";
    public String requestId;
    public RequestHead params;


    public transient  RequestCallback cb;
    private static Gson gson = new GsonBuilder().create();

    public Request(String namespace,String action,Object params,RequestCallback resultCallback){
        this.cb = resultCallback;
        this.requestId = UUID.randomUUID().toString();
        this.params = new RequestHead();
        this.params.action = action;
        this.params.namespace = namespace;
        this.params.params = params;

    }



    public String buildRequest(){ return gson.toJson(this); }

    public String cancelRequest(){
        // Build a new cancelRequest object
        CancelRequest cancelRequest = new CancelRequest();
        cancelRequest.requestId = this.requestId;
        // Return the json representation
        return gson.toJson(cancelRequest);

    }

    private class RequestHead{
        public String namespace;
        public String action;
        public Object params;
    }

    private class EmptyParams{
    }

    private class CancelRequest{
        public String requestId;
        public String messageType = "cancelRequest";
    }

    private class ResponseEnvelope{

        public String messageType;
        public String responseId;
        public Error error;


        private class Error{
            private String errorCode;
            private String description;
        }
    }

    public static abstract class RequestCallback{

        private Class resultType;

        RequestCallback(Class resultType){
            this.resultType = resultType;
        }

        public abstract void res(Object result);


        public void onData(String data){
            res(gson.fromJson(data,this.resultType));
        }

        public abstract void err(String errorCode,String description);

        public void onDone(){};
    }
}