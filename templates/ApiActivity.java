import android.app.ProgressDialog;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.annotation.StringRes;
import android.support.v7.app.AppCompatActivity;

import java.util.ArrayList;
import java.util.List;

/**
 * Created by ElectricCookie on 17.08.2016.
 */
public class ApiActivity  extends AppCompatActivity{

    private Api api;
    private ApiStatusCallback statusCallback;
    private List<Request> requests = new ArrayList<>();
    private ProgressDialog progressDialog;


    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        api  = Api.getInstance(this);

        statusCallback = new ApiStatusCallback() {
            @Override
            void onError(String errorCode, String description) {
                ApiActivity.this.onError(errorCode,description);
            }

            @Override
            void onReady() {
                ApiActivity.this.onReady();
            }

            @Override
            void onReconnectTick(int remaining) {
                showDialog(getString(R.string.re_connecting_title),getString(R.string.re_connecting_text,remaining));
            }
        };



    }

    public Api getApi() {
        return api;
    }

    public void request(Request request){
        this.requests.add(request);
        api.request(request);
    }

    @Override
    protected void onPause() {
        super.onPause();
        api.pauseConnection();
        if(progressDialog != null){
            progressDialog.hide();
        }
        for(Request request: requests){
            api.cancelRequest(request);
        }
        api.removeStatusCallback(statusCallback);
    }

    @Override
    protected void onResume() {
        super.onResume();
        api.registerStatusCallback(statusCallback);
        api.resumeConnection();

        if(api.isConnected()){
            onReady();
        }
    }

    public void showDialog(String title,String text){
        progressDialog = ProgressDialog.show(this,title,text,true,false);
    }

    public void onReady(){

    }

    public void onError(String errorCode,String description){

    }
}
