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
    this.date = this.getISODateString(this.value)
    this.time = this.getISOTimeString(this.value)
    this.dateTimeString = `${this.date} ${this.time}`
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

  /**
   * Get the date part of the given date using the browser's local time in ISO format: `YYYY-MM-DD`
   */
  private getISODateString = (date: Date): string => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`

  /**
   * Get the time part of the given date using the browser's local time in ISO format: `hh:mm`
   */
  private getISOTimeString = (date: Date): string => `${date.getHours()}:${date.getMinutes()}`

  private sliceYearFromDateString = (v: string): number => Number(v.slice(0, 4))

  private sliceMonthFromDateString = (v: string): number => Number(v.slice(5, 7))

  private sliceDayFromDateString = (v: string): number => Number(v.slice(8, 10))

  private sliceHourFromTimeString = (v: string): number => Number(v.slice(0, 2))

  private sliceMinuteFromTimeString = (v: string): number => Number(v.slice(3, 5))
}
</script>
