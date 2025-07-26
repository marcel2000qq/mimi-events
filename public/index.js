document.addEventListener('DOMContentLoaded', function () {
  const calendarContainer = document.getElementById('calendar-container');
  const dateInput = document.getElementById('booking-date');
  let calendar;

  // Funcție pentru afișarea notificărilor
  function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }

  // Inițializează calendarul FullCalendar
  function initCalendar() {
    if (!calendarContainer || !calendarContainer.querySelector('#calendar')) {
      console.error('Containerul sau elementul #calendar nu a fost găsit!');
      showNotification('Eroare: Calendarul nu poate fi inițializat!', 'error');
      return;
    }

    calendar = new FullCalendar.Calendar(calendarContainer.querySelector('#calendar'), {
      initialView: 'dayGridMonth',
      locale: 'ro',
      height: 'auto',
      headerToolbar: {
        left: 'prev',
        center: 'title',
        right: 'next'
      },
      dayMaxEvents: true,
      events: function (fetchInfo, successCallback, failureCallback) {
        try {
          const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
          const dateCounts = {};
          bookings.forEach(booking => {
            if (booking.confirmed) {
              dateCounts[booking.date] = (dateCounts[booking.date] || 0) + 1;
            }
          });

          const events = [];
          Object.keys(dateCounts).forEach(date => {
            if (dateCounts[date] >= 4) {
              events.push({
                start: date,
                display: 'background',
                className: 'fc-day-full',
                title: ''
              });
            }
          });

          successCallback(events);
        } catch (err) {
          console.error('Eroare la încărcarea evenimentelor:', err);
          showNotification(`Eroare la încărcarea calendarului: ${err.message}`, 'error');
          failureCallback(err);
        }
      },
      dateClick: function (info) {
        const dateStr = info.dateStr;
        const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        const count = bookings.filter(b => b.date === dateStr && b.confirmed).length;
        if (count < 4) {
          dateInput.value = dateStr;
          calendarContainer.style.display = 'none';
        }
      }
    });

    calendar.render();
    window.calendar = calendar;
    console.log('Calendarul a fost inițializat cu succes.');
  }

  // Afișează/ascunde calendarul la clic pe inputul de dată
  dateInput.addEventListener('click', function () {
    if (calendarContainer.style.display === 'none' || !calendarContainer.style.display) {
      calendarContainer.style.display = 'block';
      if (!calendar) {
        initCalendar();
      } else {
        setTimeout(() => {
          calendar.updateSize();
        }, 0);
      }
    } else {
      calendarContainer.style.display = 'none';
    }
  });

  // Ascunde calendarul când se face clic în afara lui
  document.addEventListener('click', function (event) {
    if (!calendarContainer.contains(event.target) && event.target !== dateInput) {
      calendarContainer.style.display = 'none';
    }
  });

  // Trimite formularul de rezervare
  const form = document.querySelector('.booking-form');
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const eventType = document.getElementById('event_type').value;
    const date = dateInput.value;
    const details = document.getElementById('details').value;

    if (!phone || !date) {
      showNotification('Vă rugăm să completați toate câmpurile obligatorii!', 'error');
      return;
    }

    try {
      let bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
      const newBooking = {
        id: Date.now(),
        name,
        email,
        phone,
        event_type: eventType,
        date,
        details,
        confirmed: false
      };
      bookings.push(newBooking);
      localStorage.setItem('bookings', JSON.stringify(bookings));
      showNotification('Rezervare trimisă cu succes!', 'success');
      form.reset();
      if (calendar && typeof calendar.refetchEvents === 'function') {
        calendar.refetchEvents();
      }
    } catch (err) {
      console.error('Eroare la trimiterea formularului:', err);
      showNotification(`Eroare la trimiterea rezervării: ${err.message}`, 'error');
    }
  });

  // Butonul „Back to Top”
  const backToTopButton = document.getElementById('back-to-top');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      backToTopButton.style.display = 'block';
    } else {
      backToTopButton.style.display = 'none';
    }
  });
  backToTopButton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Animație carusele
  function initializeCarousels() {
    const carousels = [
      { track: '.type-track', speed: 0.5 },
      { track: '.service-track', speed: 0.3 },
      { track: '.review-track', speed: 0.7 }
    ];

    carousels.forEach(carousel => {
      const track = document.querySelector(carousel.track);
      if (!track) return;

      // Clonează elementele pentru derulare infinită
      const items = track.querySelectorAll('.type-card, .service-card, .review-card');
      items.forEach(item => {
        const clone = item.cloneNode(true);
        track.appendChild(clone);
      });

      let position = 0;
      const trackWidth = track.scrollWidth / 2; // Jumătate, din cauza clonării

      function animate() {
        if (track.parentElement.matches(':hover')) return;
        position -= carousel.speed;
        if (Math.abs(position) >= trackWidth) position = 0; // Resetare lină
        track.style.transform = `translateX(${position}px)`;
        requestAnimationFrame(animate); // Continuă animația
      }

      // Pornește animația și asigură persistența
      const animationFrame = requestAnimationFrame(animate);
      track.parentElement.addEventListener('mouseenter', () => cancelAnimationFrame(animationFrame));
      track.parentElement.addEventListener('mouseleave', () => requestAnimationFrame(animate));
    });
  }

  // Inițializează caruselele
  initializeCarousels();

  // Inițializează calendarul la încărcarea paginii
  initCalendar();
});