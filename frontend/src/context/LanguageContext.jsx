import React, { createContext, useState, useEffect } from 'react';

export const LanguageContext = createContext();

const translations = {
  uz: {
    app_title: "Dacha Broni",
    login: "Kirish",
    register: "Ro'yxatdan o'tish",
    logout: "Chiqish",
    admin_panel: "Admin Panel",
    home_link: "Bosh sahifa",
    hero_title: "Tabiat qo'ynida, shovqindan uzoqda dam oling",
    hero_desc: "Oila a'zolaringiz yoki do'stlaringiz bilan hordiq chiqarish uchun mukammal dachalarni kashf eting. Bizning hamjamiyat a'zolari uchun maxsus yopiq platforma.",
    no_properties: "Hozircha bo'sh dachalar yo'q.",
    more_details: "Batafsil",
    loading: "Yuklanmoqda...",
    description_title: "Tavsif",
    choose_dates: "Sanalarni tanlang",
    week_btn: "1 Hafta (7 kun)",
    weekend_btn: "Dam olish kunlari (3 kun)",
    check_in_label: "Kirish:",
    check_out_label: "Chiqish:",
    comment_label: "Uy egasiga izoh",
    comment_placeholder: "Masalan: Oilamiz bilan kelyapmiz...",
    send_request: "So'rov yuborish",
    success_booking: "So'rov muvaffaqiyatli yuborildi! Uy egasi tez orada ko'rib chiqadi.",
    error_select_dates: "Iltimos, kirish va chiqish sanalarini tanlang.",
    error_taken_dates: "Tanlangan sanalar band qilingan.",
    error_no_free_days: "Yaqin orada ketma-ket bo'sh kunlar topilmadi.",
    error_max_3_days: "Maksimum 3 kun bron qilish mumkin. Ko'proq kun uchun admin bilan bog'laning.",
    admin_panel_title: "Admin Panel",
    incoming_requests: "Kiruvchi so'rovlar",
    manual_booking: "Qo'lda bron qilish / Taqvim",
    manage_properties: "Dachalarni boshqarish",
    approve: "Tasdiqlash",
    reject: "Rad etish",
    status_approved: "Tasdiqlangan",
    status_rejected: "Rad etilgan",
    status_blocked: "Bloklangan",
    status_pending: "Kutilmoqda",
    guest: "Mehmon:",
    admin_blocked: "Admin (Bloklangan)",
    new_property_title: "Yangi dacha qo'shish",
    name_label: "Nomi",
    desc_label: "Tavsifi",
    amenities_comma: "Qulayliklar (vergul bilan)",
    media_comma: "Media fayllar (vergul bilan)",
    save: "Saqlash",
    availability_title: "Mavjudlik oynasi (Mavsum)",
    availability_desc: "Dachani bron qilish mumkin bo'lgan sanalarni belgilang.",
    property_label: "Dacha",
    available_from: "Mavjud (Boshlanishi)",
    available_to: "Mavjud (Tugashi)",
    update_season: "Mavsumni yangilash",
    phone_label: "Telefon raqami",
    password_label: "Parol",
    no_account: "Akkauntingiz yo'qmi?",
    have_account: "Akkauntingiz bormi?",
    register_btn: "Ro'yxatdan o'tish",
    login_btn: "Tizimga kirish",
    name_placeholder: "Ismingiz",
    phone_placeholder: "Telefon raqamingiz",
    login_title: "Kirish",
    register_title: "Ro'yxatdan o'tish",
    block_dates_title: "Sanalarni bloklash / Qo'lda bron",
    block_dates_desc: "Agar dacha boshqa joyda band qilingan bo'lsa, ushbu sanalarni bloklang.",
    create_booking_btn: "Bron yaratish",
    profile_title: "Shaxsiy Kabinet",
    my_data: "Mening ma'lumotlarim",
    my_bookings: "Mening so'rovlarim",
    no_bookings: "Sizda hali bron so'rovlari yo'q."
  },
  ru: {
    app_title: "Бронирование Дач",
    login: "Войти",
    register: "Регистрация",
    logout: "Выйти",
    admin_panel: "Панель Админа",
    home_link: "Главная",
    hero_title: "Отдых на природе, вдали от суеты",
    hero_desc: "Откройте для себя идеальные загородные дома для семейного отдыха или выходных с друзьями. Уникальная закрытая платформа для участников нашего сообщества.",
    no_properties: "Пока нет доступных дач.",
    more_details: "Подробнее",
    loading: "Загрузка...",
    description_title: "Описание",
    choose_dates: "Выберите даты",
    week_btn: "Неделя (7 дн)",
    weekend_btn: "Выходные (3 дн)",
    check_in_label: "Заезд:",
    check_out_label: "Выезд:",
    comment_label: "Комментарий хозяину",
    comment_placeholder: "Например: Едем семьей с ребенком...",
    send_request: "Отправить заявку хозяину",
    success_booking: "Заявка успешно отправлена! Хозяин рассмотрит её в ближайшее время.",
    error_select_dates: "Пожалуйста, выберите даты заезда и выезда.",
    error_taken_dates: "Выбранный период включает уже занятые даты.",
    error_no_free_days: "Не удалось найти ближайшие свободные дни подряд.",
    error_max_3_days: "Максимум 3 дня. Для более длительного бронирования свяжитесь с администратором.",
    admin_panel_title: "Панель Администратора",
    incoming_requests: "Входящие заявки",
    manual_booking: "Ручная бронь / Календарь",
    manage_properties: "Управление дачами",
    approve: "Одобрить",
    reject: "Отклонить",
    status_approved: "Подтверждена",
    status_rejected: "Отклонена",
    status_blocked: "Заблокировано",
    status_pending: "Ожидает",
    guest: "Гость:",
    admin_blocked: "Админ (заблокировано)",
    new_property_title: "Добавить новую дачу",
    name_label: "Название",
    desc_label: "Описание",
    amenities_comma: "Удобства (через запятую)",
    media_comma: "Медиафайлы (названия через запятую)",
    save: "Сохранить",
    availability_title: "Окно доступности (Сезон)",
    availability_desc: "Установите даты, в которые дача доступна для бронирования.",
    property_label: "Дача",
    available_from: "Доступна С",
    available_to: "Доступна ПО",
    update_season: "Обновить сезон",
    phone_label: "Телефон",
    password_label: "Пароль",
    no_account: "Нет аккаунта?",
    have_account: "Уже есть аккаунт?",
    register_btn: "Зарегистрироваться",
    login_btn: "Войти",
    name_placeholder: "Ваше имя",
    phone_placeholder: "Ваш телефон",
    login_title: "Вход",
    register_title: "Регистрация",
    block_dates_title: "Заблокировать даты / Ручная бронь",
    block_dates_desc: "Если дача занята не через платформу, вы можете заблокировать эти даты.",
    create_booking_btn: "Создать бронь",
    profile_title: "Личный Кабинет",
    my_data: "Мои данные",
    my_bookings: "Мои заявки",
    no_bookings: "У вас пока нет заявок на бронирование."
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('appLanguage') || 'uz';
  });

  useEffect(() => {
    localStorage.setItem('appLanguage', language);
  }, [language]);

  const t = (key) => {
    return translations[language][key] || key;
  };

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'uz' ? 'ru' : 'uz'));
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
