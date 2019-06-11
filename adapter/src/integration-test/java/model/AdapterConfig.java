package model;

public class AdapterConfig {

    public final String protocol;

    public final String format;

    public final String location;

    public AdapterConfig(String protocol, String format, String location) {
        this.protocol = protocol;
        this.format = format;
        this.location = location;
    }
}
