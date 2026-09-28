import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarDays, MapPin, ArrowRight, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { errorMessage } from '../api/axios';
import './PublicEventsPage.css';

const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
});
const dateLabel = (value) =>
  new Date(value).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' });
const emptyForm = { fullName: '', email: '', phone: '' };
export default function PublicEventsPage() {
  const { id } = useParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setData(null);
    publicApi
      .get(id ? `/public/events/${id}` : '/public/events', {
        params: id ? undefined : { page, limit: 9, search: query },
        signal: controller.signal,
      })
      .then((r) => setData(r.data))
      .catch((e) => {
        if (!controller.signal.aborted) setError(errorMessage(e));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [id, page, query, reload]);
  useEffect(() => {
    setSuccess(false);
    setSubmitError('');
    setForm(emptyForm);
  }, [id]);
  async function register(e) {
    e.preventDefault();
    setBusy(true);
    setSubmitError('');
    try {
      await publicApi.post(`/public/events/${id}/registrations`, form);
      setSuccess(true);
      setForm(emptyForm);
      setData((current) =>
        current
          ? { ...current, availablePlaces: Math.max(0, current.availablePlaces - 1) }
          : current,
      );
    } catch (e) {
      const code = e.response?.data?.error?.code;
      setSubmitError(
        code === 'ALREADY_REGISTERED'
          ? 'Cette adresse email est déjà inscrite à cet événement.'
          : code === 'EVENT_FULL'
            ? 'Cet événement est complet. Aucune place supplémentaire ne peut être réservée.'
            : code === 'PUBLIC_RATE_LIMIT'
              ? 'Trop de demandes. Réessayez dans quelques minutes.'
              : errorMessage(e),
      );
      if (code === 'EVENT_FULL')
        setData((current) => (current ? { ...current, availablePlaces: 0 } : current));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="public-page">
      <header className="public-header">
        <Link className="public-brand" to="/">
          <CalendarDays size={25} /> eventhub.
        </Link>
        <Link to="/login" className="public-team">
          Espace organisateur <ArrowRight size={16} />
        </Link>
      </header>
      <main className="public-main">
        {!id ? (
          <>
            <section className="public-hero">
              <span>DES RENCONTRES QUI COMPTENT</span>
              <h1>
                Votre prochain événement
                <br />
                commence ici.
              </h1>
              <p>Découvrez les événements à venir et réservez votre place, sans créer de compte.</p>
            </section>
            <form
              className="public-search"
              onSubmit={(e) => {
                e.preventDefault();
                setQuery(search);
                setPage(1);
              }}
            >
              <Input
                aria-label="Rechercher un événement"
                placeholder="Rechercher un événement…"
                maxLength={200}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button type="submit">Rechercher</Button>
            </form>
          </>
        ) : (
          <Link className="public-back" to="/">
            ← Tous les événements
          </Link>
        )}
        {loading && <p role="status">Chargement des événements…</p>}
        {error && (
          <div role="alert">
            <p>{error}</p>
            <Button onClick={() => setReload((r) => r + 1)}>Réessayer</Button>
          </div>
        )}
        {!loading &&
          !error &&
          data &&
          (id ? (
            <div className="public-detail">
              <article>
                <span className="public-kicker">ÉVÉNEMENT À VENIR</span>
                <h1>{data.title}</h1>
                <p className="public-meta">
                  <CalendarDays size={18} />
                  {dateLabel(data.eventDate)}
                </p>
                <p className="public-meta">
                  <MapPin size={18} />
                  {data.location}
                </p>
                <p className="public-description">
                  {data.description || 'Rejoignez-nous pour cet événement.'}
                </p>
              </article>
              <section className="public-register" aria-labelledby="registration-title">
                <span className="public-spots">
                  {data.availablePlaces > 0
                    ? `${data.availablePlaces} place(s) disponible(s)`
                    : 'Complet'}
                </span>
                <h2 id="registration-title">Réservez votre place</h2>
                {success ? (
                  <div className="public-success" role="status">
                    <CheckCircle2 size={30} />
                    <h3>Inscription reçue !</h3>
                    <p>Votre demande est en attente de confirmation par l’équipe organisatrice.</p>
                    <Link to="/">Découvrir d’autres événements</Link>
                  </div>
                ) : (
                  <>
                    <p>Vos coordonnées permettent à l’équipe de gérer votre inscription.</p>
                    {submitError && (
                      <p className="alert" role="alert">
                        {submitError}
                      </p>
                    )}
                    {data.availablePlaces > 0 ? (
                      <form onSubmit={register}>
                        <Input
                          label="Nom complet"
                          autoComplete="name"
                          required
                          maxLength={200}
                          value={form.fullName}
                          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                        />
                        <Input
                          label="Adresse email"
                          type="email"
                          autoComplete="email"
                          required
                          maxLength={254}
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                        <Input
                          label="Téléphone (facultatif)"
                          type="tel"
                          autoComplete="tel"
                          maxLength={40}
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        />
                        <Button type="submit" disabled={busy}>
                          {busy ? 'Inscription en cours…' : 'S’inscrire'}
                        </Button>
                        <small>
                          Utilisez vos propres coordonnées. Aucun compte ni mot de passe n’est
                          nécessaire.
                        </small>
                      </form>
                    ) : (
                      <p>Il n’y a plus de places disponibles pour cet événement.</p>
                    )}
                  </>
                )}
              </section>
            </div>
          ) : (
            <>
              <div className="public-results">
                <h2>Événements à découvrir</h2>
                <span>{data.total} événement(s)</span>
              </div>
              {data.data.length === 0 && <p>Aucun événement ne correspond à votre recherche.</p>}
              <div className="public-grid">
                {data.data.map((event) => (
                  <article className="public-card" key={event.id}>
                    <div className="public-card-art" aria-hidden="true">
                      <CalendarDays size={44} />
                      <span>EVENTHUB</span>
                    </div>
                    <div className="public-card-body">
                      <span className="public-spots">
                        {event.availablePlaces > 0
                          ? `${event.availablePlaces} place(s)`
                          : 'Complet'}
                      </span>
                      <h3>{event.title}</h3>
                      <p className="public-meta">
                        <CalendarDays size={16} />
                        {dateLabel(event.eventDate)}
                      </p>
                      <p className="public-meta">
                        <MapPin size={16} />
                        {event.location}
                      </p>
                      <Link to={`/public/events/${event.id}`}>
                        Voir l’événement <ArrowRight size={16} />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
              {data.pagination.totalPages > 1 && (
                <nav className="public-pagination" aria-label="Pagination des événements">
                  <Button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Précédent
                  </Button>
                  <span>
                    {page} / {data.pagination.totalPages}
                  </span>
                  <Button
                    disabled={page >= data.pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Suivant
                  </Button>
                </nav>
              )}
            </>
          ))}
      </main>
      <footer className="public-footer">
        EventHub · Des événements, des rencontres, des souvenirs.
      </footer>
    </div>
  );
}
