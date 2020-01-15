<template>
  <v-form
    v-model="validForm"
  >
    <v-text-field
      v-model="firebaseParams.projectId"
      label="Id of your firebase project"
      :rules="[ required ]"
      @keyup="formChanged"
    />
    <v-text-field
      v-model="firebaseParams.clientEmail"
      label="Email of the service account to use"
      :rules="[ required ]"
      @keyup="formChanged"
    />
    <v-text-field
      v-model="firebaseParams.topic"
      label="notification topic"
      :rules="[ required ]"
      @keyup="formChanged"
    />
    <v-textarea
      v-model="firebaseParams.privateKey"
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
import { FirebaseParams } from './notificationConfig'

@Component({ })
export default class FirebaseEdit extends Vue{
  private validForm = false

  @PropSync('value')
  private firebaseParams!: FirebaseParams

  @Emit('value')
  emitValue () {
    return this.firebaseParams
  }

  @Emit('validityChanged')
  emitValid () {
    return this.validForm
  }

  formChanged () {
    this.emitValue()
    this.emitValid()
  }

  private required (val: string) {
    return !!val || 'required.'
  }

}
</script>
