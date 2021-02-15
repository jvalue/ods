package org.jvalue.ods.adapterservice.adapter.importer;

import lombok.AllArgsConstructor;

import org.jvalue.ods.adapterservice.adapter.model.exceptions.ImporterParameterException;
import org.jvalue.ods.adapterservice.datasource.model.RuntimeParameters;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@AllArgsConstructor
public class HttpImporter extends Importer {

  private final List<ImporterParameterDescription> parameters = List.of(
      new ImporterParameterDescription("location", "String of the URI for the HTTP call", String.class),
      new ImporterParameterDescription("encoding",
          "Encoding of the source. Available encodings: ISO-8859-1, US-ASCII, UTF-8", String.class),
      new ImporterParameterDescription("defaultParameters", "Default values for open parameters in the URI", false,
          RuntimeParameters.class));
  private final RestTemplate restTemplate;

  @Override
  public String getType() {
    return "HTTP";
  }

  @Override
  public String getDescription() {
    return "Plain HTTP";
  }

  @Override
  protected void validateParameters(Map<String, Object> inputParameters) throws ImporterParameterException {
    super.validateParameters(inputParameters);

    String encoding = (String) inputParameters.get("encoding");
    if (!encoding.equals(StandardCharsets.ISO_8859_1.name()) && !encoding.equals(StandardCharsets.US_ASCII.name()) && !encoding.equals(StandardCharsets.UTF_8.name())) {
      throw new IllegalArgumentException(getType() + " interpreter requires parameter encoding to have value " +
        StandardCharsets.ISO_8859_1 + ", " +
        StandardCharsets.US_ASCII + ", " +
        StandardCharsets.UTF_8
        + ". Your given value " + encoding + " is invalid!");
    }
  }

  @Override
  public List<ImporterParameterDescription> getAvailableParameters() {
    return parameters;
  }

  @Override
  protected String doFetch(Map<String, Object> parameters) throws ImporterParameterException {
    String location = parameters.get("location").toString();
    try {
      URI uri = URI.create(location);
      byte[] rawResponse = restTemplate.getForEntity(uri, byte[].class).getBody();
      return new String(rawResponse, Charset.forName((String) parameters.get("encoding")));
    } catch (IllegalArgumentException e) {
      throw new ImporterParameterException(e.getMessage());
    }
  }
}
