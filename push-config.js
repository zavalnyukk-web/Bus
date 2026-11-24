// Налаштування Web Push (сповіщення, коли сайт закрито).
// vapid: відкритий ключ (його можна показувати). worker: адреса вашого сервера на Cloudflare
// (напр. https://bus-push.ваш-логін.workers.dev); потрібна лише для тестового сповіщення при вмиканні.
window.PUSH = {
  vapid: "BNzxAgD7H13iXuQ_d61bldql8DKozi__JaSTS4ra_bfnQEr1alAVducOejFW6JCcoSOdSS3V3ZdQ8fnqq9ZKAdA",
  worker: "https://broad-firefly-b06cbus-push.zavalnyukk.workers.dev"
};
