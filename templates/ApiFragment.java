import android.app.Fragment;
import android.app.ProgressDialog;
import android.content.Context;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.util.Log;

import java.util.ArrayList;
import java.util.List;


public class ApiFragment extends Fragment {


    private Api api;
    private ApiStatusCallback statusCallback;
    private List<Request> requests = new ArrayList<>();
    private ApiActivity parent;

    public void mount(ApiActivity parent){

        Log.d("ApiFragment.java","Mounted");

        this.parent = parent;

        statusCallback = new ApiStatusCallback() {
            @Override
            void onError(String errorCode, String description) {
                ApiFragment.this.onError(errorCode,description);
            }

            @Override
            void onReady() {
                ApiFragment.this.onReady();
            }

            @Override
            void onReconnectTick(int remaining) {
            }
        };
    }

    public void request(Request request){
        this.requests.add(request);
        api.request(request);
    }

    public void cancelRequest(Request request){
        this.requests.remove(request);
        api.cancelRequest(request);
    }

    public void onResume() {
        super.onResume();
        Log.d("ApiFragment","Attached");
        this.api = this.parent.getApi();
        api.registerStatusCallback(statusCallback);
        if(api.isConnected()){
            onReady();
        }
    }


    public void onPause() {
        super.onPause();
        for(Request request: requests){
            api.cancelRequest(request);
        }
        this.parent.getApi().removeStatusCallback(statusCallback);
    }


    public void onReady(){
        Log.d("ApiFragment.java","Ready");
    }

    public void onError(String errorCode,String description){

    }



}
