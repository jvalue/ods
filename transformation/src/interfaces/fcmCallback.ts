export default interface FcmCallback {
  notification: {
    title: string;
    body: string;
  },
  topic: string;
}
