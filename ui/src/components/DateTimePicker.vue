<template>
  <v-dialog
    ref="dateDialog"
    v-model="pickDateTimeModal"
    width="290px"
    persistant
  >
    <template #activator="{ on }">
      <v-text-field
        v-model="dateTimeString"
        label="Time for First Execution"
        readonly
        v-on="on"
      />
    </template>
    <v-date-picker
      v-if="pickDateModal"
      v-model="date"
      full-width
    >
      <v-spacer />
      <v-btn
        text
        color="primary"
        @click="reset()"
      >
        Cancel
      </v-btn>
      <v-btn
        text
        color="primary"
        @click="pickDateModal = false; pickTimeModal = true;"
      >
        Next
      </v-btn>
    </v-date-picker>
    <v-time-picker
      v-if="pickTimeModal"
      v-model="time"
      full-width
    >
      <v-spacer />
      <v-btn
        text
        color="primary"
        @click="reset()"
      >
        Cancel
      </v-btn>
      <v-btn
        text
        color="primary"
        @click="onSave()"
      >
        OK
      </v-btn>
    </v-time-picker>
  </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop, Watch } from 'vue-property-decorator'
import { getISODateString, getISOTimeString } from './date-helpers'

/**
 * DateTimePicker takes a Date via v-model as input and lets the user select it.
 * The selected date is always in the local time zone of the browser, but the returned
 * Date object can be easily converted in an ISO formatted string.
 */
@Component
export default class DateTimePicker extends Vue {
  @Prop({ default: new Date() })
  private value!: Date

  private dateTimeString = ''

  private date = ''
  private time = ''

  private pickDateTimeModal = false
  private pickDateModal = true
  private pickTimeModal = false

  created (): void {
    this.reset()
  }

  @Watch('value')
  onPropertyChanged (value: Date): void {
    if (value === null) {
      return
    }

    if (!(value instanceof Date)) {
      console.error('[DateTimePicker] Expected type of argument "value" to be Date, but got: ', value)
    } else {
      this.reset()
    }
  }

  private reset (): void {
    this.resetValues()
    this.resetDialogs()
  }

  private resetValues (): void {
    this.date = getISODateString(this.value)
    this.time = getISOTimeString(this.value)
    this.dateTimeString = `${this.date} ${this.time}`
  }

  private resetDialogs (): void {
    this.pickDateTimeModal = false
    this.pickDateModal = true
    this.pickTimeModal = false
  }

  private onSave (): void {
    const selectedDate = new Date(`${this.date} ${this.time}`)
    
    this.$emit('input', selectedDate)
  }
}
</script>