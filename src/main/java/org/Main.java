package org;

import com.fastcgi.FCGIInterface;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class Main {
    private static final String HTTP_RESPONSE = """
            Status: 200 OK
            Content-Type: application/json
            Content-Length: %d
            
            %s
            """;
    private static final String HTTP_ERROR = """
            Status: 400 Bad Request
            Content-Type: application/json
            Content-Length: %d
            
            %s
            """;
    private static final String RESULT_JSON = """
            {
                "result": %b,
                "currentTime": "%s",
                "executionTimeMs": %d
            }
            """;
    private static final String ERROR_JSON = """
            {
                "reason": "%s"
            }
            """;

    public static void main(String[] args) {
        var fcgi = new FCGIInterface();
        while (fcgi.FCGIaccept() >= 0) {
            try {
                long startTime = System.nanoTime();

                // Получаем текущее время
                LocalDateTime currentTime = LocalDateTime.now();
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
                String formattedTime = currentTime.format(formatter);

                var queryParams = System.getProperties().getProperty("QUERY_STRING");
                var params = new Params(queryParams);



                var result = calculate(params.getX(), params.getY(), params.getR());

                // Расчёт времени выполнения
                long endTime = System.nanoTime();
                long duration = (endTime - startTime); // Время выполнения в наносекундах

                var json = String.format(RESULT_JSON, result, formattedTime, duration);
                var response = String.format(HTTP_RESPONSE, json.getBytes(StandardCharsets.UTF_8).length + 2, json);
                System.out.println(response);
            } catch (ValidationException e) {
                var json = String.format(ERROR_JSON, e.getMessage());
                var response = String.format(HTTP_ERROR, json.getBytes(StandardCharsets.UTF_8).length + 2, json);
                System.out.println(response);
            }
        }
    }

    private static boolean calculate(float x, float y, float r) {
        if (x < 0 && y < 0) { // if in 3rd quarter
            return false;
        }
        if (x < 0 && y > 0) { // if in 2nd quarter
            if ((x*x + y*y) > r*r) { // and NOT in circle
                return false;
            }
        }
        if (x > 0 && y > 0) { // if in 1st quarter
            if (!((x <= r) && (y <= r/2))) { // and NOT in square
                return false;
            }
        }
        if (x > 0 && y < 0) { // if in 4th quarter
            if (!(y - x + r/2 <= 0)) { // and NOT in triangle
                return false;
            }
        }
        if (x == 0) {
            if (y>r || y<-r/2) {
                return false;
            }
        }
        if (y == 0) {
            if (x>r || x<-r) {
                return false;
            }
        }
        return true;
    }
}