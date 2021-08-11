package org.jvalue.ods.adapterservice.datasource.validator;

import org.jvalue.ods.adapterservice.datasource.model.*;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.File;
import java.io.IOException;

<<<<<<< HEAD
import java.util.List;
import java.util.Arrays;

=======
>>>>>>> main
public class JsonSchemaValidatorTest {
  private final ObjectMapper mapper = new ObjectMapper();
  private final Validator validator = new JsonSchemaValidator();

  @Test
  public void testValidationSuccess() throws IOException {
    File datasourceConfig = new File("src/test/java/org/jvalue/ods/adapterservice/datasource/config/DatasourceConfig.json");
    Datasource datasourceConfigComplete = mapper.readValue(datasourceConfig, Datasource.class);
    String data = "{\"hallo\":\"test\"}";
    DataImport dataImport = new DataImport(datasourceConfigComplete, data);

<<<<<<< HEAD
    ValidationMetaData expectedMetaData = new ValidationMetaData(ValidationMetaData.HealthStatus.OK, null);
    ValidationMetaData result = validator.validate(dataImport);
    
    assertEquals(expectedMetaData.getHealthStatus(), result.getHealthStatus());
    assertEquals(expectedMetaData.getErrorMessages(), result.getErrorMessages());
=======
    ValidationMetaData expectedMetaData = new ValidationMetaData(ValidationMetaData.HealthStatus.OK);
    ValidationMetaData result = validator.validate(dataImport);

    assertEquals(expectedMetaData.getHealthStatus(), result.getHealthStatus());
    assertArrayEquals(expectedMetaData.getErrorMessages(), result.getErrorMessages());
>>>>>>> main
  }

  @Test
  public void testValidationNoSchema() throws IOException {
    File datasourceConfig = new File("src/test/java/org/jvalue/ods/adapterservice/datasource/config/DatasourceConfigNoSchema.json");
    Datasource datasourceConfigNoSchema = mapper.readValue(datasourceConfig, Datasource.class);
    String data = "{\"hallo\":\"test\"}";
    DataImport dataImport = new DataImport(datasourceConfigNoSchema, data);

<<<<<<< HEAD
    ValidationMetaData expectedMetaData = new ValidationMetaData(ValidationMetaData.HealthStatus.OK, null);
    ValidationMetaData result = validator.validate(dataImport);
    
    assertEquals(expectedMetaData.getHealthStatus(), result.getHealthStatus());
    assertEquals(expectedMetaData.getErrorMessages(), result.getErrorMessages());
=======
    ValidationMetaData expectedMetaData = new ValidationMetaData(ValidationMetaData.HealthStatus.OK);
    ValidationMetaData result = validator.validate(dataImport);

    assertEquals(expectedMetaData.getHealthStatus(), result.getHealthStatus());
    assertArrayEquals(expectedMetaData.getErrorMessages(), result.getErrorMessages());
>>>>>>> main
  }

  @Test
  public void testValidationWarning() throws IOException {
    File datasourceConfig = new File("src/test/java/org/jvalue/ods/adapterservice/datasource/config/DatasourceConfig.json");
    Datasource datasourceConfigComplete = mapper.readValue(datasourceConfig, Datasource.class);
    String data = "{\"hallo\":1}";
    DataImport dataImport = new DataImport(datasourceConfigComplete, data);
<<<<<<< HEAD
  
    String[] expectedArray = new String[1];
    expectedArray[0] = "#/hallo: expected type: String, found: Integer";
    ValidationMetaData expectedMetaData = new ValidationMetaData(
      ValidationMetaData.HealthStatus.WARNING,
      expectedArray);
=======

    String[] expectedArray = new String[]{"#/hallo: expected type: String, found: Integer"};
    ValidationMetaData expectedMetaData = new ValidationMetaData(
      ValidationMetaData.HealthStatus.WARNING, expectedArray
    );
>>>>>>> main

    ValidationMetaData result = validator.validate(dataImport);

    System.out.println(result.getErrorMessages());
    assertEquals(expectedMetaData.getHealthStatus(), result.getHealthStatus());
<<<<<<< HEAD
    assertEquals(expectedMetaData.getErrorMessages()[0], result.getErrorMessages()[0]);
=======
    assertArrayEquals(expectedMetaData.getErrorMessages(), result.getErrorMessages());
>>>>>>> main
  }
}
