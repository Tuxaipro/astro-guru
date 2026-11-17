#!/usr/bin/env python3
"""Reference values for the accuracy test (npm run test:accuracy), from the Swiss Ephemeris.

The engine computes positions with the astronomy-engine library and its own formulas (ayanamsa,
ascendant, Placidus cusps, mean node, Vimshottari dasha). This script asks an independent, widely used
ephemeris the same questions and writes tests/reference.json. The test compares the engine with it.

Run only when the cases change (the JSON is committed, so the test needs no Python):

    python3 -m venv /tmp/se && /tmp/se/bin/pip install pyswisseph
    /tmp/se/bin/python scripts/reference/make-reference.py

Moshier mode (FLG_MOSEPH) needs no data files; it agrees with JPL to well under an arcsecond for the
Sun and planets and a few arcseconds for the Moon, far tighter than the tolerances used.
"""
import json, os
from datetime import datetime, timezone
import swisseph as swe

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'tests', 'reference.json')
FLAGS = swe.FLG_MOSEPH | swe.FLG_SPEED  # apparent geocentric ecliptic of date (the engine's frame)
BODIES = {'Su': swe.SUN, 'Mo': swe.MOON, 'Ma': swe.MARS, 'Me': swe.MERCURY, 'Ju': swe.JUPITER,
          'Ve': swe.VENUS, 'Sa': swe.SATURN, 'Ra': swe.MEAN_NODE}

PLACES = {
    'Chennai': (13.0827, 80.2707), 'Delhi': (28.6139, 77.2090), 'Madurai': (9.9252, 78.1198),
    'London': (51.5074, -0.1278), 'New York': (40.7128, -74.0060), 'Sydney': (-33.8688, 151.2093),
    'Singapore': (1.3521, 103.8198),
}
# UTC moments spread over a century, at several places (birth charts and present-day transits).
CASES = [
    ('1950-03-21T04:30:00', 'Chennai'), ('1965-08-15T23:10:00', 'Delhi'), ('1972-01-05T06:45:00', 'Madurai'),
    ('1984-11-02T13:20:00', 'London'), ('1990-06-15T01:30:00', 'Chennai'), ('1999-12-31T18:00:00', 'New York'),
    ('2000-01-01T12:00:00', 'Chennai'), ('2008-07-22T09:05:00', 'Sydney'), ('2015-02-28T20:40:00', 'Singapore'),
    ('2024-04-08T18:17:00', 'New York'), ('2026-11-17T03:00:00', 'Chennai'), ('2040-09-01T00:00:00', 'Delhi'),
]
# Sunrise and sunset (upper limb on the horizon, standard refraction), for Gowri and Rahu kalam.
SUN_DAYS = [('2026-01-14', 'Chennai'), ('2026-06-21', 'Delhi'), ('2026-11-17', 'Madurai'), ('2026-03-20', 'London')]


def jd_of(iso):
    t = datetime.fromisoformat(iso).replace(tzinfo=timezone.utc)
    return swe.julday(t.year, t.month, t.day, t.hour + t.minute / 60 + t.second / 3600), int(t.timestamp() * 1000)


def ms_of_jd(jd):
    return round((jd - 2440587.5) * 86400000)


def main():
    cases = []
    for iso, place in CASES:
        jd, ms = jd_of(iso)
        lat, lon = PLACES[place]
        tropical = {}
        for code, body in BODIES.items():
            tropical[code] = swe.calc_ut(jd, body, FLAGS)[0][0]
        tropical['Ke'] = (tropical['Ra'] + 180) % 360
        cusps, ascmc = swe.houses(jd, lat, lon, b'P')
        ay = {}
        for kind, mode in (('kp', swe.SIDM_KRISHNAMURTI), ('lahiri', swe.SIDM_LAHIRI)):
            swe.set_sid_mode(mode)
            ay[kind] = swe.get_ayanamsa_ut(jd)
        cases.append({'utc': iso, 'ms': ms, 'jd': jd, 'place': place, 'lat': lat, 'lon': lon,
                      'tropical': tropical, 'asc': ascmc[0], 'cusps': list(cusps), 'ayanamsa': ay})
    sun = []
    for day, place in SUN_DAYS:
        lat, lon = PLACES[place]
        jd0 = swe.julday(*map(int, day.split('-')), 0) - lon / 360 - 0.25  # local midnight, roughly
        geo = (lon, lat, 0)
        rise = swe.rise_trans(jd0, swe.SUN, swe.CALC_RISE, geo, 0, 0, swe.FLG_MOSEPH)[1][0]
        sset = swe.rise_trans(rise, swe.SUN, swe.CALC_SET, geo, 0, 0, swe.FLG_MOSEPH)[1][0]
        sun.append({'day': day, 'place': place, 'lat': lat, 'lon': lon, 'from': ms_of_jd(jd0),
                    'rise': ms_of_jd(rise), 'set': ms_of_jd(sset)})
    data = {'source': f'Swiss Ephemeris {swe.version} (Moshier), pyswisseph', 'cases': cases, 'sun': sun}
    with open(OUT, 'w') as f:
        json.dump(data, f, indent=1)
    print(f'wrote {OUT}: {len(cases)} charts, {len(sun)} sunrise days')


if __name__ == '__main__':
    main()
