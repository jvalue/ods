package org.jvalue.ods.adapterservice.datasource.model.types;

import java.sql.*;
import java.io.Serializable;
import org.hibernate.usertype.*;
import org.hibernate.HibernateException;

import java.sql.ResultSet;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import org.hibernate.engine.spi.SharedSessionContractImplementor;

public class CustomStringArrayType implements UserType {
  @Override
  public int[] sqlTypes() {
      return new int[]{Types.ARRAY};
  }

  @Override
  public Class returnedClass() {
      return String[].class;
  }

  @Override
  public Object nullSafeGet(ResultSet rs, String[] names, SharedSessionContractImplementor session, Object owner)
    throws HibernateException, SQLException {
      Array array = rs.getArray(names[0]);
      return array != null ? array.getArray() : null;
  }

  @Override
  public void nullSafeSet(PreparedStatement st, Object value, int index, SharedSessionContractImplementor session)
    throws HibernateException, SQLException {
      if (value != null && st != null) {
          Array array = session.connection().createArrayOf("text", (String[]) value);
          st.setArray(index, array);
      } else {
          st.setNull(index, sqlTypes()[0]);
      }
  }

  @Override
  public Object	assemble(Serializable cached, Object owner) throws HibernateException {
    return cached;
  }

  @Override
  public Object	deepCopy(Object value) {
    return value;
  }

  @Override
  public Serializable	disassemble(Object value) throws HibernateException {
    return (Serializable) value;
  }

  @Override
  public boolean equals(Object x, Object y) throws HibernateException {
    return x.equals(y);
  }

  @Override
  public int	hashCode(Object x) {
    assert (x != null);
    return x.hashCode();
  }

  @Override
  public boolean	isMutable() {
    return false;
  }

  @Override
  public Object	replace(Object original, Object target, Object owner) throws HibernateException {
    return original;
  }
}
