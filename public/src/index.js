document.addEventListener('DOMContentLoaded', function () {
  const BASE_URL = 'http://localhost:3000/api'; // Backend rulează pe portul 3000

  function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  let calendar = new FullCalendar.Calendar(document.getElementById('calendar-container'), {
    initialView: 'dayGridMonth',
    locale: 'ro',
    initialDate: new Date(),
    validRange: { start: new Date() },
    headerToolbar: { left: 'prev,next today', center: '', right: 'title' },
    height: 'auto',
    contentHeight: 400,
    dayMaxEvents: true,
    selectable: true,
    selectAllow: function (selectInfo) {
      return selectInfo.start >= new Date();
    },
    events: [],
    dateClick: function (info) {
      handleDateSelection(info.dateStr);
    },
    eventClick: function (info) {
      handleDateSelection(info.event.startStr);
    },
    datesSet: async function (info) {
      const start = info.startStr;
      const end = info.endStr;
      console.log('Fetching range:', start, end);
      try {
        const response = await fetch(`${BASE_URL}/check/range?start=${start}&end=${end}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Răspunsul serverului nu este JSON valid');
        }
        const data = await response.json();
        console.log('Received data from server:', data);
        calendar.getEvents().forEach(event => event.remove());

        const days = document.querySelectorAll('.fc-daygrid-day');
        days.forEach(day => {
          const date = day.getAttribute('data-date');
          const item = data.find(d => d.date === date);
          const countSpan = day.querySelector('.reservation-count');
          if (countSpan) countSpan.remove();

          if (item) {
            const countSpan = document.createElement('span');
            countSpan.className = 'reservation-count';
            countSpan.textContent = `(${item.count})`;
            day.querySelector('.fc-daygrid-day-number').appendChild(countSpan);

            day.classList.remove('fc-day-full', 'fc-day-partial', 'fc-day-free');
            if (item.count >= 4) {
              day.classList.add('fc-day-full');
              calendar.addEvent({
                title: 'Complet',
                start: item.date,
                allDay: true,
                backgroundColor: '#4A7043',
                borderColor: '#4A7043',
                display: 'background'
              });
            } else if (item.count > 0) {
              day.classList.add('fc-day-partial');
              calendar.addEvent({
                title: `${item.count} rezervări`,
                start: item.date,
                allDay: true,
                backgroundColor: '#F5F5DC',
                borderColor: '#F5F5DC',
                display: 'background'
              });
            } else {
              day.classList.add('fc-day-free');
              calendar.addEvent({
                title: 'Liber',
                start: item.date,
                allDay: true,
                backgroundColor: '#90ee90',
                borderColor: '#90ee90',
                display: 'background'
              });
            }
          }
        });
        calendar.render();
      } catch (error) {
        console.error('Error fetching calendar data:', error.message);
        if (error.message.includes('Failed to fetch')) {
          showNotification('Eroare la conectarea la server. Calendarul funcționează offline.', 'error');
        } else if (error.message.includes('JSON')) {
          showNotification('Eroare la procesarea datelor calendarului. Verifică formatul JSON.', 'error');
        }
        calendar.getEvents().forEach(event => event.remove());
        calendar.render();
      }
    }
  });

  async function handleDateSelection(date) {
    console.log('Selected date:', date);
    try {
      const formattedDate = moment(date).format('D MMMM YYYY');
      const dateForServer = moment(date).format('YYYY-MM-DD');
      const response = await fetch(`${BASE_URL}/check/${dateForServer}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Răspunsul serverului nu este JSON valid');
      }
      const data = await response.json();
      console.log('Check result for date:', data);

      if (data.count >= 4) {
        showNotification(`Ziua ${formattedDate} este complet rezervată! Alege altă dată.`, 'error');
        return;
      }

      document.getElementById('booking-date').value = formattedDate;
      calendar.getEvents().forEach(event => event.remove());
      calendar.addEvent({
        title: 'Rezervare selectată',
        start: date,
        allDay: true,
        color: '#4A7043',
        display: 'background'
      });
      calendar.render();
      document.getElementById('calendar-container').style.display = 'none';
    } catch (error) {
      console.error('Error checking date:', error.message);
      if (error.message.includes('Failed to fetch')) {
        showNotification('Eroare la conectarea la server. Verifică conexiunea.', 'error');
      } else if (error.message.includes('JSON')) {
        showNotification('Eroare la procesarea datelor. Verifică formatul JSON.', 'error');
      } else {
        showNotification('Eroare la verificarea datei. Încearcă din nou.', 'error');
      }
    }
  }

  calendar.render();

  const bookingDateInput = document.getElementById('booking-date');
  const calendarContainer = document.getElementById('calendar-container');

  bookingDateInput.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    calendarContainer.style.display = 'block';
    calendar.gotoDate(new Date());
    calendar.render();
  });

  bookingDateInput.addEventListener('touchstart', function (e) {
    e.preventDefault();
    e.stopPropagation();
    calendarContainer.style.display = 'block';
    calendar.gotoDate(new Date());
    calendar.render();
  });

  document.addEventListener('click', function (e) {
    if (!bookingDateInput.contains(e.target) && !calendarContainer.contains(e.target)) {
      calendarContainer.style.display = 'none';
    }
  });

  document.addEventListener('touchstart', function (e) {
    if (!bookingDateInput.contains(e.target) && !calendarContainer.contains(e.target)) {
      calendarContainer.style.display = 'none';
    }
  });

  const form = document.querySelector('.booking-form');
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const phone = form.querySelector('#phone').value.trim();
    const displayDate = form.querySelector('#booking-date').value || 'Nu a fost selectată';
    const dateForServer = displayDate !== 'Nu a fost selectată' ? moment(displayDate, 'D MMMM YYYY').format('YYYY-MM-DD') : '';
    const name = form.querySelector('#name').value.trim() || 'Fără nume';
    const email = form.querySelector('#email').value.trim();
    const eventType = form.querySelector('#event_type').value || 'Fără tip';
    const details = form.querySelector('#details').value.trim() || 'Fără detalii';

    if (!phone || !displayDate || displayDate === 'Nu a fost selectată') {
      showNotification('Te rugăm să completezi numărul de telefon și să selectezi o dată.', 'error');
      return;
    }

    // if (!/\+[0-9]{2}[0-9]{9}/.test(phone)) {
    //   showNotification('Numărul de telefon trebuie să fie în formatul +40712 345 678.', 'error');
    //   return;
    // }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showNotification('Te rugăm să introduci un e-mail valid sau să lași câmpul gol.', 'error');
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/check/${dateForServer}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Răspunsul serverului nu este JSON valid');
      }
      const data = await response.json();
      if (data.count >= 4) {
        showNotification(`Ziua ${displayDate} este complet rezervată! Te rugăm să alegi altă dată.`, 'error');
        return;
      }

      const reserveResponse = await fetch(`${BASE_URL}/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateForServer, name, email, phone, eventType, details })
      });
      if (!reserveResponse.ok) {
        throw new Error(`HTTP error! status: ${reserveResponse.status}`);
      }

      showNotification('Cererea ta a fost trimisă! Îți vom contacta în curând pentru confirmare.', 'success');
      form.reset();
      calendar.getEvents().forEach(event => event.remove());
      calendarContainer.style.display = 'block';
      calendar.render();
    } catch (error) {
      console.error('Error submitting reservation:', error.message);
      if (error.message.includes('Failed to fetch')) {
        showNotification('Eroare la conectarea la server. Verifică conexiunea.', 'error');
      } else if (error.message.includes('JSON')) {
        showNotification('Eroare la procesarea datelor. Verifică formatul JSON.', 'error');
      } else {
        showNotification('Eroare la trimiterea cererii. Încearcă din nou.', 'error');
      }
    }
  });

  const backToTop = document.getElementById('back-to-top');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) backToTop.style.display = 'block';
    else backToTop.style.display = 'none';
  });
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  function initializeInfiniteCarousel(trackSelector, cardSelector, speed) {
    const track = document.querySelector(trackSelector);
    const container = track.parentElement;
    const cards = Array.from(document.querySelectorAll(cardSelector));
    for (let i = 0; i < 3; i++) cards.forEach(card => track.appendChild(card.cloneNode(true)));
    const updatedCards = track.querySelectorAll(cardSelector);
    let scrollPosition = 0, isPaused = false, lastResetTime = performance.now();
    const cardWidth = updatedCards[0].offsetWidth + parseFloat(getComputedStyle(updatedCards[0]).marginRight);
    const totalWidth = cardWidth * cards.length;

    function scrollCarousel(currentTime) {
      if (!isPaused) {
        scrollPosition += speed;
        if (currentTime - lastResetTime >= 300000 || scrollPosition >= totalWidth * 3) {
          scrollPosition = 0;
          lastResetTime = currentTime;
          track.style.transition = 'none';
          track.style.transform = `translateX(-${scrollPosition}px)`;
          void track.offsetWidth;
          track.style.transition = 'transform 0.5s linear';
        } else {
          track.style.transform = `translateX(-${scrollPosition}px)`;
        }
      }
      requestAnimationFrame(scrollCarousel);
    }

    requestAnimationFrame(scrollCarousel);
    container.addEventListener('mouseenter', () => isPaused = true);
    container.addEventListener('mouseleave', () => isPaused = false);
  }

  initializeInfiniteCarousel('.type-track', '.type-card', 1);
  initializeInfiniteCarousel('.service-track', '.service-card', 1.5);
  initializeInfiniteCarousel('.review-track', '.review-card', 0.8);
});