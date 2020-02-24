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
import { WebhookNotification } from '@/pipeline/notifications/notificationConfig'

@Component({ })
export default class WebhookEdit extends Vue {
  private validForm = false

  @PropSync('value')
  private webhookNotification!: WebhookNotification

  @Emit('value')
  emitValue () {
    return this.webhookNotification
  }

  @Emit('validityChanged')
  emitValid () {
    return this.validForm
  }

  formChanged () {
    this.emitValue()
    this.emitValid()
  }

  private validURL (url: string) {
    const urlRegex = new RegExp('^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$', 'i') // fragment locator
    return !!url && url.match(urlRegex) || 'URL invalid'
  }
}
</script>
