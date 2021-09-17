<template>
  <v-form v-model="isValid">
    <v-text-field v-model="parameters.workspaceId" label="Id of your slack workspace" :rules="[required]" />
    <v-text-field v-model="parameters.channelId" label="Id of the channel" :rules="[required]" />
    <v-text-field v-model="parameters.secret" label="Incoming webhook secret" :rules="[required]" />
  </v-form>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import { Emit, PropSync, Watch } from 'vue-property-decorator';

import { requiredRule } from '../validators';

import { SlackNotificationParameters } from '@/notification/notificationConfig';

@Component({})
export default class SlackNotificationForm extends Vue {
  @PropSync('value')
  private parameters!: SlackNotificationParameters;

  private isValid = false;

  private required = requiredRule;

  private mounted(): void {
    this.initialValidityCheck();
  }

  private initialValidityCheck(): void {
    this.emitIsValid();
  }

  @Emit('value')
  emitValue(): SlackNotificationParameters {
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
}
</script>
