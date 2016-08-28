import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Handler;
import android.util.Log;

import com.koushikdutta.async.callback.CompletedCallback;
import com.koushikdutta.async.http.AsyncHttpClient;
import com.koushikdutta.async.http.AsyncHttpGet;
import com.koushikdutta.async.http.AsyncHttpRequest;
import com.koushikdutta.async.http.AsyncHttpResponse;
import com.koushikdutta.async.http.Headers;
import com.koushikdutta.async.http.WebSocket;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;


/**
 * Created by ElectricCookie on 04.08.2016.
 * using: compile 'com.koushikdutta.async:androidasync:2.+'
 */
public class Api {

    private static final String TAG = "Api.java";
    private Context mContext;
    private static final int DISCONNECT_TIMEOUT = 8000;
    private static Api sInstance;
    //Internal vars
    private boolean connected = false;
    private Handler handler = new Handler();
    private WebSocket socket;

    private int reConnectAttempt = 0;
    private int reConnectTimeout = 0;

    private BaseUrlProvider baseUrlProvider;
    private SsidProvider ssidProvider;


    private List<ApiStatusCallback> statusCallbacks = new ArrayList<>();



    // Que
    private List<String> pendingRequests = new ArrayList<>();

    // Stored requests
    private List<Request> requests = new ArrayList<>();

    // Static runnables
    private Runnable disconnectAfterIdle = new Runnable() {
        @Override
        public void run() {
            disconnect();
        }
    };

    private Runnable reConnectRunnable = new Runnable() {
        @Override
        public void run() {
            if(reConnectTimeout == 0) {
                connect();
            }else{
                reConnectTimeout--;
                for(ApiStatusCallback callback: statusCallbacks){
                    callback.onReconnectTick(reConnectTimeout);
                }
                handler.postDelayed(this,1000);
            }
        }
    };


    // Default constructor
    Api(Context context){
        mContext = context;
        baseUrlProvider = new BaseUrlProvider(context);
        ssidProvider = new SsidProvider(context);
    }

    //Singleton stuff
    public static Api getInstance(Context context){
        if(sInstance != null){
            if(sInstance.mContext != context){
                sInstance.updateContext(context);
            }
        }else{
            sInstance = new Api(context);
        }
        return sInstance;
    }


    public void updateContext(Context context){
        mContext = context;
        baseUrlProvider = new BaseUrlProvider(context);
        ssidProvider = new SsidProvider(context);
    }

    // Lifecycle methods
    public void pauseConnection(){
        handler.postDelayed(disconnectAfterIdle,DISCONNECT_TIMEOUT);
        handler.removeCallbacks(reConnectRunnable);
    }

    public void resumeConnection(Context context){
        if(!isConnected()){
            Log.d(TAG,"RESUMING CONNECTION");
            updateContext(context);
            connect();
        }
        handler.removeCallbacks(disconnectAfterIdle);
    }


    public void registerStatusCallback(ApiStatusCallback callback){
        this.statusCallbacks.add(callback);
    }

    public void removeStatusCallback(ApiStatusCallback callback){
        for(int i = 0; i < statusCallbacks.size(); i++){
            if(statusCallbacks.get(i) == callback){
                statusCallbacks.remove(i);
                break;
            }
        }
    }


    public void disconnect(){
        if(isConnected()){
            socket.close();
            connected  = false;

            for(Request request: requests){
               request.cb.err("disconnected","Manually disconnected from the server.");
            }
            requests.clear();
        }

        handler.removeCallbacks(reConnectRunnable);

    }

    public boolean isConnected() { return connected; }

    public void request(Request request){ trySend(request.buildRequest()); requests.add(request); }

    public  void cancelRequest(Request request){ trySend(request.cancelRequest()); }

    private void trySend(String req){
        Log.d(TAG,req);
        if(isConnected()){
           try{
               socket.send(req);
           }catch (Exception e){
               pendingRequests.add(req);
           }
        }else{
            pendingRequests.add(req);
        }
    }

    private void processString(String source){
        try{
            final JSONObject data = new JSONObject(source);
            final String messageType = data.getString("messageType");
            final String requestId = data.getString("requestId");
            Log.d(TAG,source);
            switch(messageType){
                case "response":
                    for (Request request : requests) {
                        if (request.requestId.equals(requestId)) {
                            request.cb.onData(data.getJSONObject("params").toString());
                        }
                    }
                    break;
                case "error":

                    String errorCode = data.getJSONObject("params").getString("errorCode");
                    String description = data.getJSONObject("params").getString("description");

                    for (Request request : requests) {
                        if (request.requestId.equals(requestId)) {
                            Log.d(TAG,"Found error");
                            request.cb.err(errorCode,description);
                        }
                    }

                    for(ApiStatusCallback callback: statusCallbacks){
                        callback.onError(errorCode,description);
                    }

                    break;
                case "done":

                    for(int i = 0; i < requests.size();i++){
                        if(requests.get(i).requestId.equals(requestId)){
                            requests.get(i).cb.onDone();
                            Log.d(TAG,"Removed request");
                            requests.remove(i);
                            break;
                        }
                    }
                    break;
                default:
                    Log.e(TAG,"Unknown message type: "+messageType);
                    break;
            }
        }catch(Exception e){
            Log.e(TAG,"Could not process message"+e.getMessage());
        }
    }

    private void setupSocket(WebSocket socket){
        this.socket = socket;
        socket.setClosedCallback(new CompletedCallback() {
            @Override
            public void onCompleted(Exception ex) {
                if(ex != null) {
                    reConnect();
                }
            }
        });


        socket.setStringCallback(new WebSocket.StringCallback() {
            @Override
            public void onStringAvailable(String s) {
                processString(s);
            }
        });
        connected = true;
        for(String req: pendingRequests){
            socket.send(req);
        }
        pendingRequests.clear();


        for(ApiStatusCallback callback : statusCallbacks){
            callback.onReady();
        }

    }



    public void connect(){

        disconnect();

        if(!baseUrlProvider.hasBaseUrl()){
            mContext.startActivity(new Intent(mContext,Connect.class));
            return;
        }

        if(!ssidProvider.hasSsid()){
            fetchSsid();
            return;
        }

        Log.d(TAG,"Connecting");



        Uri uri = Uri.parse("http://"+baseUrlProvider.getBaseUrl()+"/main/about");


        final AsyncHttpRequest req = new AsyncHttpRequest(uri,"GET",new Headers().add("Cookie","flood-ssid="+ssidProvider.getSsid()));

        AsyncHttpClient.getDefaultInstance().websocket(req, null, new AsyncHttpClient.WebSocketConnectCallback() {
            @Override
            public void onCompleted(Exception ex, WebSocket webSocket) {

                if(ex != null){
                    reConnect();
                }else{
                    setupSocket(webSocket);
                }

            }


        });

    }

    private int getRetryTime(int attempt){
        return attempt*attempt;
    }



    private void reConnect(){

        reConnectTimeout = getRetryTime(reConnectAttempt);

        reConnectAttempt++;

        reConnectRunnable.run();

    }


    private void fetchSsid(){

        Log.d(TAG,baseUrlProvider.getBaseUrl());

        AsyncHttpGet req = new AsyncHttpGet("http://"+baseUrlProvider.getBaseUrl()+"/main/about");

        AsyncHttpClient.getDefaultInstance().executeString(req,new AsyncHttpClient.StringCallback(){
            @Override
            public void onCompleted(Exception e, AsyncHttpResponse source, String result) {
                try {
                    String ssid = Utils.parseCookie(source.headers().get("Set-Cookie"));
                    if(ssid.length() != 0){
                        ssidProvider.setSsid(ssid);
                        connect();
                    }else{
                        reConnect();
                    }
                } catch (Exception anyException) {

                    reConnect();

                }
            }
        });
    }
}
