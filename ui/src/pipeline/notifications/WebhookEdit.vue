<template>
  <v-form
    v-model="validForm"
  >
    <v-text-field
      v-model="webhookNotification.url"
      label="URL to trigger the Webhook at"
      :rules="[ validURL ]"
      @keyup="formChanged"
    />
  </v-form>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Emit, PropSync } from 'vue-property-decorator'
import { WebhookNotification } from './notificationConfig'

@Component({ })
export default class WebhookEdit extends Vue {
  private validForm = false

  @PropSync('value')
  private webhookNotification!: WebhookNotification

  @Emit('value')
  emitValue (): WebhookNotification {
    return this.webhookNotification
  }

  @Emit('validityChanged')
  emitValid (): boolean {
    return this.validForm
  }

  formChanged (): void {
    this.emitValue()
    this.emitValid()
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
