async function handleDateSelection(dateStr) {
  console.log('Selected date:', dateStr);
  try {
    const date = new Date(dateStr);
    if (date < new Date().setHours(0, 0, 0, 0)) {
      showNotification('Nu poți selecta o dată din trecut!', 'error');
      return;
    }
    const formattedDate = moment(dateStr).format('D MMMM YYYY');
    const dateForServer = moment(dateStr).format('YYYY-MM-DD');
    document.getElementById('booking-date').value = formattedDate;
    calendar.getEvents().forEach(event => event.remove());
    calendar.addEvent({
      title: 'Rezervare selectată',
      start: dateStr,
      allDay: true,
      backgroundColor: '#4A7043',
      borderColor: '#4A7043',
      display: 'background'
    });
    calendar.render();
    document.getElementById('calendar-container').style.display = 'none';
  } catch (error) {
    console.error('Error:', error.message);
    showNotification('Eroare la selectarea datei. Încearcă din nou.', 'error');
  }
}
