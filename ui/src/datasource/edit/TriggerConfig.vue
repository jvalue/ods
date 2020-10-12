<template>
  <v-form
    v-model="isValid"
  >
    <v-switch
      v-model="triggerConfig.periodic"
      label="Periodic execution"
      @change="formChanged"
    />
    <date-time-picker
      v-model="triggerConfig.firstExecution"
      @change="formChanged"
    />

    <span class="subheading font-weight-light mr-1">
      Interval: {{ dialogIntervalHours }}h {{ dialogIntervalMinutes }}m
    </span>
    <v-subheader>Hours</v-subheader>
    <v-slider
      v-model="dialogIntervalHours"
      track-color="grey"
      always-dirty
      step="1"
      ticks="always"
      thumb-label="always"
      tick-size="3"
      :tick-labels="hoursTickLabels"
      min="0"
      max="24"
      @change="formChanged"
    >
      <template #prepend>
        <v-icon
          color="error"
          @click="dialogIntervalHours--; formChanged()"
        >
          mdi-minus
        </v-icon>
      </template>

      <template #append>
        <v-icon
          color="primary"
          @click="dialogIntervalHours++; formChanged()"
        >
          mdi-plus
        </v-icon>
      </template>
    </v-slider>

    <v-subheader>Minutes</v-subheader>
    <v-slider
      v-model="dialogIntervalMinutes"
      track-color="grey"
      always-dirty
      step="1"
      ticks="always"
      thumb-label="always"
      :tick-labels="minutesTickLabels()"
      min="0"
      max="60"
      @change="formChanged"
    >
      <template #prepend>
        <v-icon
          color="error"
          @click="dialogIntervalMinutes--; formChanged()"
        >
          mdi-minus
        </v-icon>
      </template>

      <template #append>
        <v-icon
          color="primary"
          @click="dialogIntervalMinutes++; formChanged()"
        >
          mdi-plus
        </v-icon>
      </template>
    </v-slider>
  </v-form>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import { Emit, PropSync, Watch } from 'vue-property-decorator'
import DateTimePicker from '@/components/DateTimePicker.vue'

import { Trigger } from '../datasource'

const ONE_HOUR_IN_MS = 3600 * 1000
const ONE_MINUTE_IN_MS = 60 * 1000

@Component({ components: { DateTimePicker } })
export default class TriggerConfig extends Vue {
  private isValid = true;

  private dialogIntervalHours = 1
  private dialogIntervalMinutes = 0

  private hoursTickLabels = [
    '0h', '', '', '', '', '',
    '6h', '', '', '', '', '',
    '12h', '', '', '', '', '',
    '18h', '', '', '', '', '',
    '24h'
  ]

  private minutesTickLabels (): string[] {
    const ticks = new Array(61)
    ticks[0] = '0m'
    ticks[15] = '15m'
    ticks[30] = '30m'
    ticks[45] = '45m'
    ticks[60] = '60m'
    return ticks
  }

  @PropSync('value')
  private triggerConfig!: Trigger;

  @Watch('triggerConfig')
  private triggerConfigChanged (): void {
    this.loadDialogIntervalForSlider()
  }

  @Emit('value')
  emitValue (): Trigger {
    return this.triggerConfig
  }

  @Emit('validityChanged')
  emitValid (): boolean {
    return this.isValid
  }

  formChanged (): void {
    this.setTriggerInterval()

    this.emitValue()
    this.emitValid()
  }

  private setTriggerInterval (): void {
    const hoursInMS = this.dialogIntervalHours * ONE_HOUR_IN_MS
    const minutesInMS = this.dialogIntervalMinutes * ONE_MINUTE_IN_MS
    this.triggerConfig.interval = hoursInMS + minutesInMS
  }

  private loadDialogIntervalForSlider (): void {
    if (this.triggerConfig.interval <= 1) {
      this.dialogIntervalHours = 0
      this.dialogIntervalMinutes = 0
      return
    }

    const intervalInMS = this.triggerConfig.interval
    this.dialogIntervalHours = this.getHoursFromMS(intervalInMS)
    this.dialogIntervalMinutes = this.getMinutesFromMS(intervalInMS)
  }

  private getHoursFromMS (intervalInMS: number): number {
    return Math.floor(intervalInMS / ONE_HOUR_IN_MS)
  }

  private getMinutesFromMS (intervalInMS: number): number {
    return Math.floor((intervalInMS % ONE_HOUR_IN_MS) / ONE_MINUTE_IN_MS)
  }
}
</script>
