CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    "typeClient" VARCHAR(50) NOT NULL,
    nom VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    tel VARCHAR(50),
    adresse TEXT,
    status VARCHAR(50) NOT NULL,
    "dateCreation" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_clients_id ON clients (id);
CREATE INDEX ix_clients_email ON clients (email);

CREATE TABLE projets (
    id SERIAL PRIMARY KEY,
    "clientID" INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    "nomProjet" VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL,
    "dateDebut" DATE,
    "dateFin" DATE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_projets_id ON projets (id);
CREATE INDEX ix_projets_clientID ON projets ("clientID");
CREATE INDEX ix_projets_status ON projets (status);

CREATE TABLE ressources (
    "ressourceID" SERIAL PRIMARY KEY,
    "projetID" INTEGER NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
    nom VARCHAR(200) NOT NULL,
    type VARCHAR(100),
    url VARCHAR(500),
    description TEXT
);
CREATE INDEX ix_ressources_ressourceID ON ressources ("ressourceID");
CREATE INDEX ix_ressources_projetID ON ressources ("projetID");

CREATE TABLE utilisateurs (
    "userID" SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    "motDePasse" VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    "dateCreation" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_utilisateurs_userID ON utilisateurs ("userID");
CREATE INDEX ix_utilisateurs_email ON utilisateurs (email);

CREATE TABLE projet_utilisateurs (
    "projetID" INTEGER NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
    "userID" INTEGER NOT NULL REFERENCES utilisateurs("userID") ON DELETE CASCADE,
    PRIMARY KEY ("projetID", "userID")
);
CREATE INDEX ix_projet_utilisateurs_projetID ON projet_utilisateurs ("projetID");
CREATE INDEX ix_projet_utilisateurs_userID ON projet_utilisateurs ("userID");

CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    "projetID" INTEGER NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
    nom VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    prix NUMERIC(10,2),
    "dateRenouvellement" DATE,
    statut VARCHAR(50) NOT NULL,
    url TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_services_id ON services (id);
CREATE INDEX ix_services_projetID ON services ("projetID");
CREATE INDEX ix_services_statut ON services (statut);

CREATE TABLE acces (
    "accesID" SERIAL PRIMARY KEY,
    "projetID" INTEGER REFERENCES projets(id) ON DELETE SET NULL,
    "serviceID" INTEGER REFERENCES services(id) ON DELETE SET NULL,
    login VARCHAR(200) NOT NULL,
    "motDePasse" VARCHAR(500) NOT NULL,
    url VARCHAR(500),
    description VARCHAR(255),
    note TEXT
);
CREATE INDEX ix_acces_accesID ON acces ("accesID");
CREATE INDEX ix_acces_projetID ON acces ("projetID");
CREATE INDEX ix_acces_serviceID ON acces ("serviceID");

CREATE TABLE rappels (
    id SERIAL PRIMARY KEY,
    "clientID" INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    "typeRappel" VARCHAR(50),
    "dateRappel" TIMESTAMP,
    message TEXT,
    statut VARCHAR(50) NOT NULL,
    priorite VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_rappels_id ON rappels (id);
CREATE INDEX ix_rappels_clientID ON rappels ("clientID");
CREATE INDEX ix_rappels_statut ON rappels (statut);

CREATE TABLE devis (
    "devisID" SERIAL PRIMARY KEY,
    "clientID" INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    "projetID" INTEGER REFERENCES projets(id) ON DELETE SET NULL,
    "dateDevis" TIMESTAMP NOT NULL DEFAULT NOW(),
    "validUntil" TIMESTAMP,
    "totalAmount" NUMERIC(12,2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    notes TEXT
);
CREATE INDEX ix_devis_devisID ON devis ("devisID");
CREATE INDEX ix_devis_clientID ON devis ("clientID");
CREATE INDEX ix_devis_projetID ON devis ("projetID");
CREATE INDEX ix_devis_status ON devis (status);

CREATE TABLE devis_projets (
    "devisID" INTEGER NOT NULL REFERENCES devis("devisID") ON DELETE CASCADE,
    "projetID" INTEGER NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
    PRIMARY KEY ("devisID", "projetID")
);
CREATE INDEX ix_devis_projets_devisID ON devis_projets ("devisID");
CREATE INDEX ix_devis_projets_projetID ON devis_projets ("projetID");

CREATE TABLE factures (
    "factureID" SERIAL PRIMARY KEY,
    "clientID" INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    "devisID" INTEGER REFERENCES devis("devisID") ON DELETE SET NULL,
    "dateFacture" TIMESTAMP NOT NULL DEFAULT NOW(),
    "dueDate" TIMESTAMP,
    "amountHT" NUMERIC(12,2) NOT NULL,
    "amountTTC" NUMERIC(12,2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    "taxRate" NUMERIC(5,2) NOT NULL,
    "paymentDate" TIMESTAMP
);
CREATE INDEX ix_factures_factureID ON factures ("factureID");
CREATE INDEX ix_factures_clientID ON factures ("clientID");
CREATE INDEX ix_factures_devisID ON factures ("devisID");
CREATE INDEX ix_factures_status ON factures (status);

CREATE TABLE facture_projets (
    "factureID" INTEGER NOT NULL REFERENCES factures("factureID") ON DELETE CASCADE,
    "projetID" INTEGER NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
    PRIMARY KEY ("factureID", "projetID")
);
CREATE INDEX ix_facture_projets_factureID ON facture_projets ("factureID");
CREATE INDEX ix_facture_projets_projetID ON facture_projets ("projetID");

CREATE TABLE contrats (
    "contratID" SERIAL PRIMARY KEY,
    "clientID" INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    "projetID" INTEGER REFERENCES projets(id) ON DELETE SET NULL,
    "dateDebut" DATE,
    "dateFin" DATE,
    "typeContrat" VARCHAR(100) NOT NULL,
    montant NUMERIC(12,2) NOT NULL,
    conditions TEXT,
    status VARCHAR(50) NOT NULL
);
CREATE INDEX ix_contrats_contratID ON contrats ("contratID");
CREATE INDEX ix_contrats_clientID ON contrats ("clientID");
CREATE INDEX ix_contrats_projetID ON contrats ("projetID");
CREATE INDEX ix_contrats_status ON contrats (status);

CREATE TABLE cahier_de_charge (
    "cahierID" SERIAL PRIMARY KEY,
    "projetID" INTEGER NOT NULL UNIQUE REFERENCES projets(id) ON DELETE CASCADE,
    objet VARCHAR(255) NOT NULL,
    description TEXT,
    "dateCreation" TIMESTAMP NOT NULL DEFAULT NOW(),
    "dateValidation" TIMESTAMP,
    "fileUrl" VARCHAR(500)
);
CREATE INDEX ix_cahier_de_charge_cahierID ON cahier_de_charge ("cahierID");
CREATE INDEX ix_cahier_de_charge_projetID ON cahier_de_charge ("projetID");

CREATE TABLE ai_monitoring (
    "monitoringID" SERIAL PRIMARY KEY,
    "serviceID" INTEGER NOT NULL UNIQUE REFERENCES services(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    uptime NUMERIC(5,2) NOT NULL,
    "responseTime" NUMERIC(8,3),
    "lastCheck" TIMESTAMP NOT NULL DEFAULT NOW(),
    checks TEXT,
    alerts TEXT
);
CREATE INDEX ix_ai_monitoring_monitoringID ON ai_monitoring ("monitoringID");
CREATE INDEX ix_ai_monitoring_serviceID ON ai_monitoring ("serviceID");
CREATE INDEX ix_ai_monitoring_status ON ai_monitoring (status);
