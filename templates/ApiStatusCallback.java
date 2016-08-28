/**
 * Created by ElectricCookie on 17.08.2016.
 */
public abstract class ApiStatusCallback {


    public abstract void onError(String errorCode,String description);

    public abstract void onReady();

    public abstract void onReconnectTick(int remaining);


}
