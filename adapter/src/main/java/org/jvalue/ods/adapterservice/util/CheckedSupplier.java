package org.jvalue.ods.adapterservice.util;

/**
 * Helper interface to enable lambda functions that are allowed to throw exceptions.
 */
@FunctionalInterface
public interface CheckedSupplier<T> {
  T get() throws Exception;
}
