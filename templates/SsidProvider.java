import android.content.Context;

public class SsidProvider {

    private Context mContext;
    private String SETTINGS_NAME = "SSID";
    private String SETTINGS_KEY = "ssid";

    SsidProvider(Context context){
        mContext = context;
    }

    public void setSsid(String ssid){
        mContext.getSharedPreferences(SETTINGS_NAME,0)
                .edit()
                .putString(SETTINGS_KEY,ssid)
                .apply();
    }

    public void resetSsid(){
        mContext
                .getSharedPreferences(SETTINGS_NAME,0)
                .edit()
                .remove(SETTINGS_KEY)
                .apply();
    }

    public String getSsid(){
        return mContext
                .getSharedPreferences(SETTINGS_NAME,0)
                .getString(SETTINGS_KEY,"");

    }

    public boolean hasSsid(){
        return mContext.getSharedPreferences(SETTINGS_NAME,0).contains(SETTINGS_KEY);
    }

}
