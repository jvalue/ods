<template>
  <v-form
    v-model="validForm"
  >
    <v-text-field
      v-model="firebaseNotification.projectId"
      label="Id of your firebase project"
      :rules="[ required ]"
      @keyup="formChanged"
    />
    <v-text-field
      v-model="firebaseNotification.clientEmail"
      label="Email of the service account to use"
      :rules="[ required ]"
      @keyup="formChanged"
    />
    <v-text-field
      v-model="firebaseNotification.topic"
      label="notification topic"
      :rules="[ required ]"
      @keyup="formChanged"
    />
    <v-textarea
      v-model="firebaseNotification.privateKey"
      label="private key of the service account"
      :rules="[ required ]"
      @keyup="formChanged"
    />
  </v-form>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Emit, PropSync } from 'vue-property-decorator'
import { FirebaseNotification } from './notificationConfig'

@Component({ })
export default class FirebaseEdit extends Vue {
  private validForm = false

  @PropSync('value')
  private firebaseNotification!: FirebaseNotification

  @Emit('value')
  emitValue (): FirebaseNotification {
    return this.firebaseNotification
  }

  @Emit('validityChanged')
  emitValid (): boolean {
    return this.validForm
  }

  formChanged (): void {
    this.emitValue()
    this.emitValid()
  }

  private required (val: string): true | string {
    return !!val || 'required.'
  }
}
</script>
