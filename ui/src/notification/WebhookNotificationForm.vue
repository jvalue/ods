<template>
  <v-form
    v-model="isValid"
  >
    <v-text-field
      v-model="parameters.url"
      label="URL to trigger the Webhook at"
      :rules="[ validURL ]"
    />
  </v-form>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Emit, PropSync, Watch } from 'vue-property-decorator'
import { WebhookNotificationParameters } from './notificationConfig'

@Component({ })
export default class WebhookNotificationForm extends Vue {
  @PropSync('value')
  private parameters!: WebhookNotificationParameters

  private isValid = false

  private mounted (): void {
    this.emitIsValid() // initial validity check on rendering
  }

  @Emit('value')
  emitValue (): WebhookNotificationParameters {
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

  private validURL (url: string): true | string {
    const urlRegex = new RegExp('^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$', 'i') // fragment locator
    if (!!url && !!url.match(urlRegex)) {
      return true
    }
    return 'URL invalid'
  }
}
</script>
