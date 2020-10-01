<template>
  <v-form
    v-model="isValid"
  >
    <v-text-field
      v-model="parameters.projectId"
      label="Id of your firebase project"
      :rules="[ required ]"
    />
    <v-text-field
      v-model="parameters.clientEmail"
      label="Email of the service account to use"
      :rules="[ required ]"
    />
    <v-text-field
      v-model="parameters.topic"
      label="notification topic"
      :rules="[ required ]"
    />
    <v-textarea
      v-model="parameters.privateKey"
      label="private key of the service account"
      :rules="[ required ]"
    />
  </v-form>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Emit, PropSync, Watch } from 'vue-property-decorator'

import { FirebaseNotificationParameters } from '@/notification/notificationConfig'

@Component({ })
export default class FirebaseNotificationForm extends Vue {
  @PropSync('value')
  private parameters!: FirebaseNotificationParameters

  private isValid = false

  private mounted (): void {
    this.emitIsValid() // initial validity check on rendering
  }

  @Emit('value')
  emitValue (): FirebaseNotificationParameters {
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
