import { getDb, initDb } from './index';

async function seed() {
  await initDb();
  const db = await getDb();
  const now = new Date().toISOString();

  await db.exec(`
    DELETE FROM messages;
    DELETE FROM channels;
    DELETE FROM todos;
    DELETE FROM shopping_items;
    DELETE FROM events;
    DELETE FROM transactions;
    DELETE FROM accounts;
    DELETE FROM members;
  `);

  // Members
  await db.run("INSERT INTO members (id, name, color, emoji) VALUES ('jose', 'José', '#378ADD', '👨')");
  await db.run("INSERT INTO members (id, name, color, emoji) VALUES ('anais', 'Anaïs', '#D4537E', '👩')");
  await db.run("INSERT INTO members (id, name, color, emoji) VALUES ('lucas', 'Lucas', '#639922', '🧒')");

  // Accounts (initial_balance calculé pour que solde final = LCL 2850€, SG 1340€)
  await db.run("INSERT INTO accounts (name, bank, initial_balance, color) VALUES ('LCL Principal', 'LCL', 1705.43, '#378ADD')");
  await db.run("INSERT INTO accounts (name, bank, initial_balance, color) VALUES ('SG / BFM', 'SG', 235.99, '#D4537E')");

  // LCL transactions (account_id = 1)
  const txs = [
    [1, 'Salaire CAP VIDEO José', 2160.05, 'income', 'salaires', '2026-05-05', 1, 'jose', null, 0],
    [1, 'Remboursement locatif CIP GESTION', 1500, 'income', 'loyers_percus', '2026-05-10', 1, 'jose', 'Remboursement loyer locatif', 1],
    [1, 'Crédit immobilier LCL 09/10', 927.71, 'expense', 'credit_immo', '2026-05-08', 1, 'jose', 'Crédit appt 09/10', 1],
    [1, 'Crédit immobilier LCL 20/21', 337.77, 'expense', 'credit_immo', '2026-05-08', 1, 'jose', 'Crédit appt 20/21', 1],
    [1, 'Loyer résidence principale', 850, 'expense', 'loyer_residence', '2026-05-01', 1, 'jose', null, 0],
    [1, 'Courses Leclerc', 400, 'expense', 'courses', '2026-05-15', 1, null, null, 0],
    [1, 'PACIFICA Assurance habitation', 45.20, 'expense', 'assurances', '2026-05-03', 1, null, null, 0],
    [1, 'Don Croix-Rouge', 20, 'expense', 'dons', '2026-05-12', 0, 'jose', null, 0],
    [1, 'Épargne Livret A', 200, 'expense', 'epargne', '2026-05-20', 0, 'jose', null, 0],
    // SG transactions (account_id = 2)
    [2, 'Salaire Anaïs', 1200, 'income', 'salaires', '2026-05-05', 1, 'anais', null, 0],
    [2, 'CIP GESTION loyers', 465.91, 'income', 'cip_gestion', '2026-05-10', 1, 'anais', 'Recettes locatives nettes', 1],
    [2, 'SPOTIFY abonnement famille', 10.99, 'expense', 'abonnements', '2026-05-01', 1, null, null, 0],
    [2, 'Mutuelle santé ACM', 85, 'expense', 'assurances', '2026-05-05', 1, 'anais', null, 0],
    [2, 'BOUYGUES mobile', 25.99, 'expense', 'telecom', '2026-05-10', 0, null, null, 0],
    [2, 'FREE internet', 19.99, 'expense', 'telecom', '2026-05-10', 0, null, null, 0],
    [2, 'CAF aide logement', 120, 'income', 'caf', '2026-05-15', 0, null, null, 0],
    [2, 'PREDICA assurance vie', 50, 'expense', 'assurances', '2026-05-20', 0, 'anais', null, 0],
  ];
  for (const t of txs) {
    await db.run(
      'INSERT INTO transactions (account_id,label,amount,type,category,date,validated,member_id,notes,is_rental) VALUES (?,?,?,?,?,?,?,?,?,?)',
      t
    );
  }

  // Events
  const events = [
    ["Réunion parents d'élèves Lucas", '2026-05-26', '18:30', '2026-05-26', '20:00', "École primaire - réunion de fin d'année", '["jose","anais"]', '#639922', 'École Pasteur', 30],
    ['Médecin généraliste José', '2026-05-28', '10:00', '2026-05-28', '11:00', 'Bilan de santé annuel', '["jose"]', '#378ADD', 'Cabinet Dr. Martin', 60],
    ['Week-end famille', '2026-05-30', null, '2026-05-31', null, 'Week-end à la campagne', '["jose","anais","lucas"]', '#FF6B35', null, null],
    ['Anniversaire Lucas', '2026-06-03', '14:00', '2026-06-03', '18:00', "Fête d'anniversaire de Lucas (8 ans)", '["jose","anais","lucas"]', '#639922', 'Maison', 1440],
    ['RDV banque LCL', '2026-06-10', '09:00', '2026-06-10', '09:30', 'Révision du crédit immobilier', '["jose","anais"]', '#378ADD', 'Agence LCL Centre', 120],
  ];
  for (const e of events) {
    await db.run(
      'INSERT INTO events (title,date,time,end_date,end_time,description,member_ids,color,location,reminder_minutes) VALUES (?,?,?,?,?,?,?,?,?,?)',
      e
    );
  }

  // Shopping items
  const items = [
    ['Pommes', 'fruits_legumes', '1', 'kg', 0, 'anais'],
    ['Courgettes', 'fruits_legumes', '4', 'pcs', 0, 'anais'],
    ['Yaourts nature', 'laitiers', '1', 'pack 8', 0, 'jose'],
    ['Emmental râpé', 'laitiers', '200', 'g', 1, 'jose'],
    ['Pâtes fusilli', 'epicerie', '2', 'paquets', 0, 'lucas'],
    ['Sauce tomate', 'epicerie', '2', 'bocaux', 0, 'anais'],
    ['Escalopes de poulet', 'viandes', '500', 'g', 0, 'jose'],
    ['Pizza jambon', 'surgeles', '2', 'pcs', 0, 'lucas'],
    ['Lessive liquide', 'hygiene', '1', 'bouteille 3L', 0, 'anais'],
    ['Gel douche', 'hygiene', '2', 'flacons', 1, 'anais'],
  ];
  for (const i of items) {
    await db.run(
      'INSERT INTO shopping_items (name,category,quantity,unit,checked,added_by,created_at) VALUES (?,?,?,?,?,?,?)',
      [...i, now]
    );
  }

  // Todos
  const todos = [
    ['Payer la taxe foncière', 'Échéance avant fin mai', 'high', 'jose', 'pending', '2026-05-31', null],
    ['Acheter cadeau Lucas', 'Pour son anniversaire le 3 juin', 'high', 'anais', 'pending', '2026-05-30', 4],
    ["Réviser l'assurance auto", 'Comparer les offres MAIF vs GROUPAMA', 'normal', 'jose', 'pending', '2026-06-05', null],
    ['Préparer dossier CAF', 'Mettre à jour les ressources', 'normal', 'anais', 'pending', '2026-05-28', null],
    ['Chercher plombier', 'Fuite robinet salle de bain', 'high', 'jose', 'pending', '2026-05-25', null],
    ['Réserver vacances été', 'Juillet ou août, plage ou montagne', 'low', 'anais', 'pending', '2026-06-15', null],
  ];
  for (const t of todos) {
    await db.run(
      'INSERT INTO todos (title,description,priority,assigned_to,status,due_date,event_id,created_at) VALUES (?,?,?,?,?,?,?,?)',
      [...t, now]
    );
  }

  // Channels
  const channels = [
    ['budget', 'Budget du foyer', 'Finances et dépenses familiales', '["jose","anais","lucas"]', '💰'],
    ['famille', 'Famille entière', 'Discussion générale de la famille', '["jose","anais","lucas"]', '🏠'],
    ['jose-anais', 'José & Anaïs', 'Canal privé couple', '["jose","anais"]', '❤️'],
    ['lucas', 'Lucas', 'Canal de Lucas', '["jose","anais","lucas"]', '🎮'],
  ];
  for (const c of channels) {
    await db.run('INSERT INTO channels (id,name,description,member_ids,icon) VALUES (?,?,?,?,?)', c);
  }

  // Messages
  const msgs: any[][] = [
    ['budget', 'jose', "J'ai reçu mon salaire ce mois-ci ✅", 'action', '2026-05-05T09:15:00Z', JSON.stringify({ action: 'salary_received', amount: 2160.05, member: 'jose' })],
    ['budget', 'anais', 'Mon salaire aussi, on est bons pour mai 👍', 'text', '2026-05-05T09:30:00Z', null],
    ['budget', 'jose', 'Le loyer locatif a été payé par CIP Gestion', 'action', '2026-05-10T14:00:00Z', JSON.stringify({ action: 'rent_validated', amount: 1500 })],
    ['budget', 'anais', "On pense à mettre 200€ de côté ce mois-ci ?", 'text', '2026-05-10T18:30:00Z', null],
    ['budget', 'jose', "Oui, je programme le virement Livret A 💰", 'text', '2026-05-10T18:45:00Z', null],
    ['famille', 'anais', "N'oubliez pas la réunion parents d'élèves le 26 mai !", 'text', '2026-05-20T08:00:00Z', null],
    ['famille', 'lucas', "C'est quand mon anniversaire déjà ? 😄", 'text', '2026-05-20T16:30:00Z', null],
    ['famille', 'jose', "Le 3 juin mon grand ! On prépare une belle fête 🎂", 'text', '2026-05-20T17:00:00Z', null],
    ['famille', 'anais', "Qu'est-ce que tu voudrais comme cadeau Lucas ?", 'text', '2026-05-20T17:05:00Z', null],
    ['famille', 'lucas', "Un LEGO Technic !! 🚀", 'text', '2026-05-20T17:10:00Z', null],
    ['famille', 'jose', "Noté ! On regarde ça avec maman.", 'text', '2026-05-20T17:15:00Z', null],
    ['jose-anais', 'anais', "T'as vu le relevé LCL ? On a bien récupéré le remboursement", 'text', '2026-05-10T20:00:00Z', null],
    ['jose-anais', 'jose', "Oui ! Solde LCL en bonne forme ce mois-ci 😊", 'text', '2026-05-10T20:10:00Z', null],
    ['jose-anais', 'anais', "Il faudrait penser à renégocier le crédit LCL 09/10...", 'text', '2026-05-11T09:00:00Z', null],
    ['jose-anais', 'jose', "J'ai pris RDV à la banque le 10 juin !", 'text', '2026-05-11T09:30:00Z', null],
    ['jose-anais', 'anais', "Parfait ❤️", 'text', '2026-05-11T09:35:00Z', null],
    ['lucas', 'lucas', "Papa j'ai besoin d'argent pour la cantine", 'text', '2026-05-19T07:30:00Z', null],
    ['lucas', 'jose', "Combien il te faut ?", 'text', '2026-05-19T07:45:00Z', null],
    ['lucas', 'lucas', "15€ pour la semaine", 'text', '2026-05-19T07:50:00Z', null],
    ['lucas', 'jose', "OK je t'en donne ce soir 👍", 'text', '2026-05-19T07:55:00Z', null],
  ];
  for (const m of msgs) {
    await db.run(
      'INSERT INTO messages (channel_id,member_id,content,type,timestamp,metadata) VALUES (?,?,?,?,?,?)',
      m
    );
  }

  console.log('✅ Base de données initialisée avec les données démo !');
  console.log('   - 3 membres : José, Anaïs, Lucas');
  console.log('   - 2 comptes : LCL (2850€) et SG (1340€)');
  console.log('   - 17 transactions');
  console.log('   - 5 événements agenda');
  console.log('   - 10 articles courses');
  console.log('   - 6 tâches to-do');
  console.log('   - 4 canaux de chat avec historique');
}

seed().catch(e => { console.error(e); process.exit(1); });
