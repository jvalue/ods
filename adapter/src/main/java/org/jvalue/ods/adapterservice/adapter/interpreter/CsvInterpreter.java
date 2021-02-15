package org.jvalue.ods.adapterservice.adapter.interpreter;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.MappingIterator;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.dataformat.csv.CsvMapper;
import com.fasterxml.jackson.dataformat.csv.CsvParser;
import com.fasterxml.jackson.dataformat.csv.CsvSchema;

import org.jvalue.ods.adapterservice.adapter.model.exceptions.InterpreterParameterException;

import java.io.IOException;
import java.util.List;
import java.util.Map;

public class CsvInterpreter extends Interpreter {

  private final List<InterpreterParameterDescription> parameters = List.of(
    new InterpreterParameterDescription("columnSeparator", "Column delimiter character, only one character supported", String.class),
    new InterpreterParameterDescription("lineSeparator", "Line delimiter character, only \\r, \\r\\n, and \\n supported", String.class),
    new InterpreterParameterDescription("skipFirstDataRow", "Skip first data row (after header)", Boolean.class),
    new InterpreterParameterDescription("firstRowAsHeader", "Interpret first row as header for columns", Boolean.class)
  );
  private final CsvMapper mapper = new CsvMapper().enable(CsvParser.Feature.WRAP_AS_ARRAY);
  private final ObjectMapper jsonMapper = new ObjectMapper();

  @Override
  public String getType() {
    return "CSV";
  }

  @Override
  public String getDescription() {
    return "Interpret data as CSV data";
  }

  @Override
  public List<InterpreterParameterDescription> getAvailableParameters() {
    return parameters;
  }

  @Override
  protected void validateParameters(Map<String, Object> inputParameters) throws InterpreterParameterException {
    super.validateParameters(inputParameters);

    String lineSeparator = (String) inputParameters.get("lineSeparator");
    if (!lineSeparator.equals("\n") && !lineSeparator.equals("\r") && !lineSeparator.equals("\r\n")) {
      throw new InterpreterParameterException(getType() + " interpreter requires parameter lineSeparator to have" +
        " value \\n, \\r, or \\r\\n. Your given value " + lineSeparator + " is invalid!");
    }

    String columnSeparator = (String) inputParameters.get("columnSeparator");
    if (columnSeparator.length() != 1) {
      throw new InterpreterParameterException(getType() + " interpreter requires parameter columnSeparator to have" +
        " length 1. Your given value " + columnSeparator + " is invalid!");
    }
  }

  @Override
  protected JsonNode doInterpret(String data, Map<String, Object> parameters) throws IOException {
    CsvSchema csvSchema = createSchema(parameters);
    if ((boolean) parameters.get("firstRowAsHeader")) {
      return parseWithHeader(data, csvSchema);
    } else {
      return parseWithoutHeader(data, csvSchema);
    }
  }

  private CsvSchema createSchema(Map<String, Object> parameters) {
    CsvSchema csvSchema = CsvSchema
      .emptySchema()
      .withColumnSeparator(((String) parameters.get("columnSeparator")).charAt(0))
      .withLineSeparator((String) parameters.get("lineSeparator"))
      .withSkipFirstDataRow((boolean) parameters.get("skipFirstDataRow"));
    if ((boolean) parameters.get("firstRowAsHeader")) {
      csvSchema = csvSchema
        .withHeader();
    }
    return csvSchema;
  }

  private JsonNode parseWithoutHeader(String data, CsvSchema csvSchema) throws IOException {
    MappingIterator<Object[]> allLines = mapper
      .readerFor(Object[].class)
      .with(csvSchema)
      .readValues(data);

    ArrayNode result = mapper.createArrayNode();
    while (allLines.hasNext()) {
      result.add(jsonMapper.valueToTree(allLines.next()));
    }

    return result;
  }

  private JsonNode parseWithHeader(String data, CsvSchema csvSchema) throws IOException {
    MappingIterator<Map<String, String>> allLines = mapper
      .readerFor(Map.class)
      .with(csvSchema)
      .readValues(data);

    ArrayNode result = mapper.createArrayNode();
    while (allLines.hasNext()) {
      result.add(jsonMapper.valueToTree(allLines.next()));
    }

    return result;
  }
}
