export default interface FcmCallback {
  validate_only: boolean;
  message: FCMMessage;
}

interface FCMMessage {
  notification: FCMNotification;
}

interface FCMNotification {
  title: string;
  body: string;
}
