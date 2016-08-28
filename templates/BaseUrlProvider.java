import android.content.Context;

public class BaseUrlProvider {

    private Context mContext;
    private String SETTINGS_NAME = "BASE_URL";
    private String SETTINGS_KEY = "url";

    public BaseUrlProvider(Context context){
        mContext = context;
    }

    public boolean hasBaseUrl(){
        return mContext.getSharedPreferences(SETTINGS_NAME,0).contains(SETTINGS_KEY);
    }

    public String getBaseUrl(){
        return mContext.getSharedPreferences(SETTINGS_NAME,0).getString(SETTINGS_KEY,"");
    }

    public void clearBaseUrl(){
        mContext.getSharedPreferences(SETTINGS_NAME,0).edit().remove(SETTINGS_KEY).apply();
    }

    public void setBaseUrl(String baseUrl){
        mContext.getSharedPreferences(SETTINGS_NAME,0).edit().putString(SETTINGS_KEY,baseUrl).apply();
    }


}
