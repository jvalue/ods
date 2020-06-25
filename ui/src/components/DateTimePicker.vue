<template>
  <v-dialog
    ref="dateDialog"
    v-model="pickDateTimeModal"
    persistent
    full-width
    width="290px"
    persistant
  >
    <template v-slot:activator="{ on }">
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

/**
 * DateTimePicker takes a Date via v-model as input and lets the user select it.
 * The selected date is always in the local time zone of the browser.
 *
 * Overwrite the formatDateTimePresentation method to change the string representation.
 */
@Component
export default class DateTimePicker extends Vue {
  @Prop({ default: null })
  private value!: Date;

  private dateTimeString = '';

  private date = '';

  private time = '';

  private pickDateTimeModal = false;

  private pickDateModal = true;

  private pickTimeModal = false;

  created (): void {
    this.reset()
  }

  @Watch('value')
  onPropertyChanged (value: Date): void {
    if (value == null) {
      return
    }

    if (!(value instanceof Date)) {
      console.error(
        '[DateTimePicker] Expected type of argument "value" to be Date, but got: ',
        value
      )
    } else {
      this.reset()
    }
  }

  private reset (): void {
    this.resetValues()
    this.resetDialogs()
  }

  private resetValues (): void {
    const dateString = this.value.toISOString()
    this.dateTimeString = this.formatDateTimePresentation(this.value)
    this.date = this.sliceDateFromString(dateString)
    this.time = this.sliceTimeFromString(dateString)
  }

  private formatDateTimePresentation (date: Date): string {
    const dateString = date.toISOString()
    // timezone: UTC (because offset is cut)
    return `${this.sliceDateFromString(dateString)} ${this.sliceTimeFromString(dateString)} UTC`
  }

  private resetDialogs (): void {
    this.pickDateTimeModal = false
    this.pickDateModal = true
    this.pickTimeModal = false
  }

  private onSave (): void {
    const selectedDate = new Date(
      this.sliceYearFromDateString(this.date),
      this.sliceMonthFromDateString(this.date) - 1,
      this.sliceDayFromDateString(this.date),
      this.sliceHourFromTimeString(this.time),
      this.sliceMinuteFromTimeString(this.time)
    )

    console.log(`Selected Date ${selectedDate.toISOString()}`)
    this.$emit('input', selectedDate) // update parent
  }

  private sliceDateFromString = (v: string): string => v.slice(0, 10)

  private sliceTimeFromString = (v: string): string => v.slice(11, 16)

  private sliceYearFromDateString = (v: string): number => Number(v.slice(0, 4))

  private sliceMonthFromDateString = (v: string): number => Number(v.slice(5, 7))

  private sliceDayFromDateString = (v: string): number => Number(v.slice(8, 10))

  private sliceHourFromTimeString = (v: string): number => Number(v.slice(0, 2))

  private sliceMinuteFromTimeString = (v: string): number => Number(v.slice(3, 5))
}
</script>
