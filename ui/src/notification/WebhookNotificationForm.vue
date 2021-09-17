<template>
  <v-form v-model="isValid">
    <v-text-field v-model="parameters.url" label="URL to trigger the Webhook at" :rules="[validURL]" />
  </v-form>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import { Emit, PropSync, Watch } from 'vue-property-decorator';
import { InputValidationRule } from 'vuetify';

import { isNullOrUndefined } from '../validators';

import { WebhookNotificationParameters } from './notificationConfig';

@Component({})
export default class WebhookNotificationForm extends Vue {
  @PropSync('value')
  private parameters!: WebhookNotificationParameters;

  private isValid = false;

  private mounted(): void {
    this.initialValidityCheck();
  }

  private initialValidityCheck(): void {
    this.emitIsValid();
  }

  @Emit('value')
  emitValue(): WebhookNotificationParameters {
    return this.parameters;
  }

  @Emit('changeValidity')
  emitIsValid(): boolean {
    return this.isValid;
  }

  @Watch('parameters', { deep: true })
  onChangeFormModel(): void {
    this.emitValue();
  }

  @Watch('isValid')
  private onChangeValidity(): void {
    this.emitIsValid();
  }

  private validURL: InputValidationRule = url => {
    const urlRegex = new RegExp(
      '^(https?:\\/\\/)?' + // Protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // Domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // Port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // Query string
        '(\\#[-a-z\\d_]*)?$',
      'i',
    ); // Fragment locator

    if (!isNullOrUndefined(url) && typeof url === 'string' && urlRegex.test(url)) {
      return true;
    }

    return 'URL invalid';
  };
}
</script>
