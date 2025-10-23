import React, { useState, useEffect } from "react";

// Путь к изображениям в папке public (без /public в URL)
const imagePaths = [
  "/images/gallery/people.webp",
  "/images/gallery/architecture.webp",
  "/images/gallery/nature.jpg",
  "/images/gallery/city.jpg",
];

export function Home() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Автоматическая смена изображений каждые 3 секунды
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    const startInterval = () => {
      interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % imagePaths.length);
      }, 3000);
    };

    // Запускаем интервал, если не наведён курсор
    if (!isHovered) {
      startInterval();
    }

    // Очищаем предыдущий интервал при каждом изменении isHovered
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isHovered]); // Зависимость от isHovered

  const goToPrevious = () => {
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + imagePaths.length) % imagePaths.length
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % imagePaths.length);
  };

  return (
    <>
      <section className="hero is-primary is-bold">
        <div className="hero-body">
          <div className="container">
            <h1 className="title is-1">Добро пожаловать в Челябинск!</h1>
            <h2 className="subtitle is-3">
              Откройте для себя уникальные места и интересных людей нашего
              города.
            </h2>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="columns is-vcentered">
            <div className="column is-half">
              <h2 className="title is-2">Исследуйте Челябинск</h2>
              <p className="subtitle is-5">
                Наш сайт &mdash; это ваш путеводитель по лучшим местам и
                личностям Челябинска.
              </p>
              <div className="content">
                <ul>
                  <li>
                    <strong>Интересные места:</strong> Откройте для себя скрытые
                    жемчужины, популярные кафе, парки и культурные центры.
                  </li>
                  <li>
                    <strong>Интересные люди:</strong> Познакомьтесь с
                    талантливыми жителями города, чьи истории вдохновляют.
                  </li>
                  <li>
                    <strong>Достопримечательности:</strong> Узнайте историю и
                    значимость известных мест Челябинска.
                  </li>
                  <li>
                    <strong>Делитесь своим:</strong> Знаете потрясающее место?
                    Поделитесь им с сообществом!
                  </li>
                </ul>
              </div>
            </div>
            <div className="column is-half">
              {/* Контейнер для галереи (как карточка) */}
              <div
                className="box"
                style={{
                  height: "300px",
                  position: "relative",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#f5f5f5",
                  borderRadius: "6px", // Закругленные края
                }}
                onMouseEnter={() => setIsHovered(true)} // Останавливает смену
                onMouseLeave={() => setIsHovered(false)} // Возобновляет смену
              >
                {/* Изображение на всю карточку */}
                <img
                  src={imagePaths[currentIndex]}
                  alt={`Gallery ${currentIndex + 1}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover", // Заполняет контейнер, сохраняя пропорции
                    borderRadius: "6px", // Закругленные края у изображения
                    transition: "opacity 0.5s ease-in-out",
                  }}
                />

                {/* Кнопка "Назад" */}
                {isHovered && (
                  <button
                    className="button is-small is-dark"
                    style={{
                      position: "absolute",
                      left: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      opacity: 0.6,
                      transition: "opacity 0.3s",
                      borderRadius: "50%", // Круглая кнопка
                      width: "32px",
                      height: "32px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0, // Убираем внутренние отступы, чтобы картинка занимала всю кнопку
                    }}
                    onClick={goToPrevious}
                    aria-label="Предыдущее изображение"
                  >
                    <img
                      src="/images/arrow.png" // Путь к изображению стрелки
                      alt="Предыдущее"
                      style={{
                        width: "16px",
                        height: "16px",
                        transform: "scaleX(-1)", // Переворачиваем стрелку влево
                      }}
                    />
                  </button>
                )}

                {/* Кнопка "Вперед" */}
                {isHovered && (
                  <button
                    className="button is-small is-dark"
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      opacity: 0.6,
                      transition: "opacity 0.3s",
                      borderRadius: "50%", // Круглая кнопка
                      width: "32px",
                      height: "32px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0, // Убираем внутренние отступы
                    }}
                    onClick={goToNext}
                    aria-label="Следующее изображение"
                  >
                    <img
                      src="/images/arrow.png" // Путь к изображению стрелки
                      alt="Следующее"
                      style={{
                        width: "16px",
                        height: "16px",
                        // Без transform, стрелка смотрит вправо
                      }}
                    />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section has-background-light">
        <div className="container">
          <h2 className="title is-2 has-text-centered mb-6">
            Почему стоит присоединиться?
          </h2>
          <div className="columns is-multiline">
            <div className="column is-one-third">
              <div className="card">
                <div className="card-content">
                  <p className="title is-4">Откройте новое</p>
                  <p className="subtitle is-6">
                    Узнайте о Челябинске то, что никогда не замечали. Найдите
                    новое любимое место.
                  </p>
                </div>
              </div>
            </div>
            <div className="column is-one-third">
              <div className="card">
                <div className="card-content">
                  <p className="title is-4">Вдохновляйтесь</p>
                  <p className="subtitle is-6">
                    Истории и достижения интересных людей города могут
                    вдохновить вас.
                  </p>
                </div>
              </div>
            </div>
            <div className="column is-one-third">
              <div className="card">
                <div className="card-content">
                  <p className="title is-4">Делитесь опытом</p>
                  <p className="subtitle is-6">
                    Расскажите о своем любимом месте или человеке. Помогите
                    другим открыть Челябинск!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container has-text-centered">
          <h2 className="title is-2">Готовы начать?</h2>
          <p className="subtitle is-4">
            Присоединяйтесь к сообществу и исследуйте Челябинск вместе с нами!
          </p>
          <a href="/attractions" className="button is-primary is-large">
            Посмотреть интересные места
          </a>
        </div>
      </section>
    </>
  );
}
