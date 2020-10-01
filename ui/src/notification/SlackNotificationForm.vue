<template>
  <v-form
    v-model="isValid"
  >
    <v-text-field
      v-model="parameters.workspaceId"
      label="Id of your slack workspace"
      :rules="[ required ]"
    />
    <v-text-field
      v-model="parameters.channelId"
      label="Id of the channel"
      :rules="[ required ]"
    />
    <v-text-field
      v-model="parameters.secret"
      label="Incoming webhook secret"
      :rules="[ required ]"
    />
  </v-form>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Emit, PropSync, Watch } from 'vue-property-decorator'

import { SlackNotificationParameters } from '@/notification/notificationConfig'

@Component({ })
export default class SlackNotificationForm extends Vue {
  @PropSync('value')
  private parameters!: SlackNotificationParameters

  private isValid = false

  private mounted (): void {
    this.emitIsValid() // initial validity check on rendering
  }

  @Emit('value')
  emitValue (): SlackNotificationParameters {
    return this.parameters
  }

  @Emit('validityChanged')
  emitIsValid (): boolean {
    return this.isValid
  }

  @Watch('parameters', { deep: true })
  formChanged (): void {
    this.emitValue()
  }

  @Watch('isValid')
  private validityChanged (): void {
    this.emitIsValid()
  }

  private required (val: string): true | string {
    return !!val || 'required.'
  }
}
</script>
