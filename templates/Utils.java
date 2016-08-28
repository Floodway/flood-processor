import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Created by ElectricCookie on 17.08.2016.
 */
public class Utils {


    public static String parseCookie(String source){
        Map<String,String> result = new HashMap<>();
        Pattern finder = Pattern.compile("\\w+-\\w+-\\w+\\-\\w+\\w-\\w+");

        Matcher matcher = finder.matcher(source);



        if(matcher.find()){
            return matcher.group(0);

        }else{
            return "";
        }
    }

}
