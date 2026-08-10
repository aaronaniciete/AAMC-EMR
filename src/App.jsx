import React, { useState, useEffect, useCallback } from "react";
import {
  CalendarDays, Users, Stethoscope, Pill, Home, Search, Plus, X,
  Baby, UserRound, AlertTriangle, ChevronLeft, Clock, FileText,
  ShieldAlert, LogOut, Trash2, Check, ClipboardList, Pencil, Layers
} from "lucide-react";
import { supabase } from "./lib/supabase.js";

/* ---------------------------------------------------------
   CLINIC EMR PROTOTYPE
   Single-file demo. Data lives in artifact storage (shared),
   NOT a real database. See the banner in the app for caveats.
--------------------------------------------------------- */

const STORAGE_KEY = "clinic-data";
const CLINIC_KEY = "clinic-info";

const defaultClinicInfo = () => ({
  name: "ALBA-ANICIETE MEDICAL CLINIC",
  address: "2nd floor DG's Building, Don V. Robles, Poblacion 3, Tiaong, Quezon",
  phone: "+639175605585",
});

const emptyData = () => ({
  patients: [],
  appointments: [],
  treatmentPlans: [],
  prescriptions: [],
  certificates: [],
  physicalExams: [],
  labRequests: [],
  auditLog: [],
});

/* ---------------- Common medications (from clinic Rx templates) ---------------- */
const COMMON_MEDS_ADULT = [
  { name: "Cefuroxime 500mg (Eroxmit)", dosage: "500mg, 1 tab", frequency: "AM & PM (2x/day)", duration: "7 days", notes: "Antibiotic — take after meals" },
  { name: "Cefpodoxime 200mg (Swich)", dosage: "200mg, 1 tab", frequency: "AM & PM (2x/day)", duration: "7 days", notes: "Antibiotic — take after meals" },
  { name: "Cefixime 200mg", dosage: "200mg, 1 tab", frequency: "AM & PM (2x/day)", duration: "7 days", notes: "Antibiotic — take after meals" },
  { name: "Azithromycin 500mg (Azmicin)", dosage: "500mg, 1 tab", frequency: "NN, 1x/day", duration: "5 days", notes: "Antibiotic — take after meals" },
  { name: "N-Acetylcysteine 600mg (Mucoprime)", dosage: "600mg, 1 tab", frequency: "PM, 1x/day", duration: "7 days", notes: "Pampatunaw ng plema (mucolytic) — before bedtime" },
  { name: "Montelukast + Levocetirizine 10mg/5mg", dosage: "1 tab", frequency: "PM, 1x/day", duration: "7 days", notes: "" },
  { name: "Cetirizine 10mg (Zyrrigin)", dosage: "10mg, 1 tab", frequency: "PM, 1x/day", duration: "7 days", notes: "" },
  { name: "Salbutamol nebule + 1mL Sodium Chloride", dosage: "1 nebule + 1mL NSS", frequency: "AM, NN & PM (3x/day)", duration: "5 days", notes: "" },
  { name: "Vitamin C + Zinc", dosage: "1 tab", frequency: "NN, 1x/day", duration: "30 days", notes: "" },
  { name: "Astaxanthin + Multivitamins", dosage: "1 tab", frequency: "NN, 1x/day", duration: "30 days", notes: "" },
  { name: "Multivitamins (Globifer)", dosage: "1 tab", frequency: "NN, 1x/day", duration: "30 days", notes: "" },
  { name: "Paracetamol 500mg", dosage: "500mg, 1 tab", frequency: "Every 4 hours, PRN", duration: "As needed", notes: "For fever or pain" },
  { name: "Oral Rehydration Salt Sachet", dosage: "1 sachet in 1 glass of water", frequency: "AM, NN & PM (3x/day)", duration: "3 days", notes: "" },
  { name: "Levofloxacin 500mg (Levonol)", dosage: "500mg, 1 tab", frequency: "NN, 1x/day", duration: "7 days", notes: "Antibiotic — take after meals" },
  { name: "Prednisone 20mg", dosage: "20mg, 1 tab", frequency: "NN, 1x/day", duration: "5 days", notes: "Anti-inflammatory — after meals" },
  { name: "Paracetamol + Phenylpropanolamine + Chlorphenamine (DECON-A)", dosage: "1 tab", frequency: "AM, NN & PM (3x/day)", duration: "5 days", notes: "" },
  { name: "Co-Amoxiclav 625mg (Clovintin)", dosage: "625mg, 1 tab", frequency: "AM & PM (2x/day)", duration: "7 days", notes: "Antibiotic — after meals" },
  { name: "Ciprofloxacin 500mg (Ciclodin)", dosage: "500mg, 1 tab", frequency: "AM & PM (2x/day)", duration: "7 days", notes: "Antibiotic — after meals" },
  { name: "Pantoprazole + Domperidone (Zole-Done)", dosage: "1 tab", frequency: "AM, 1x/day", duration: "7 days", notes: "For stomach pain, vomiting & dizziness — 30 min before breakfast" },
  { name: "Potassium Citrate 1080mg", dosage: "1080mg, 1 tab", frequency: "AM, NN & PM (3x/day)", duration: "7 days", notes: "Antiurolithic — after meals" },
  { name: "Potassium Chloride 750mg", dosage: "750mg, 1 tab", frequency: "AM, NN & PM (3x/day)", duration: "3 days", notes: "After meals" },
  { name: "Rowatinex Capsule", dosage: "1 cap", frequency: "AM, NN & PM (3x/day)", duration: "30 days", notes: "Pampatunaw ng bato sa daluyan ng ihi (for urinary stones)" },
  { name: "Sambong 500mg Capsule", dosage: "500mg, 1 cap", frequency: "AM, NN & PM (3x/day)", duration: "30 days", notes: "Pampatunaw ng bato sa daluyan ng ihi (for urinary stones)" },
  { name: "Tramadol 37.5mg + Paracetamol 325mg Tablet (Tramadin Plus)", dosage: "1 tab", frequency: "AM, NN & PM (3x/day)", duration: "As needed", notes: "For pain" },
  { name: "Hyoscine N-Butylbromide 10mg", dosage: "10mg, 1 tab", frequency: "AM, NN & PM (3x/day)", duration: "As needed", notes: "Para sa hilab (for cramps/pain)" },
  { name: "Flavos", dosage: "1 tab", frequency: "AM, 1x/day", duration: "30 days", notes: "Pampatunaw ng bato sa daluyan ng ihi (for urinary stones)" },
  { name: "Sodium Chloride Nasal Spray", dosage: "1 spray", frequency: "AM, NN & PM (3x/day)", duration: "7 days", notes: "Pampatunaw ng sipon (for colds)" },
  { name: "Sinupret", dosage: "1 tab", frequency: "AM, NN & PM (3x/day)", duration: "5 days", notes: "Pampalabas ng sipon (decongestant)" },
  { name: "Fluticasone Nasal Spray", dosage: "1 spray", frequency: "AM & PM (2x/day)", duration: "2 weeks", notes: "For allergy" },
  { name: "Salmeterol 250mg + Fluticasone 50mg", dosage: "1 puff/dose", frequency: "AM & PM (2x/day)", duration: "2 weeks", notes: "" },
  { name: "Ofloxacin Otic Drops", dosage: "5 drops", frequency: "AM, NN & PM (3x/day)", duration: "7 days", notes: "For affected ear" },
  { name: "Docusate Sodium Ear Drops", dosage: "1 drop", frequency: "AM & PM (2x/day)", duration: "5 days", notes: "Pampalambot ng tutule (softens earwax)" },
  { name: "Clotrimazole Cream", dosage: "Apply thin layer", frequency: "AM, NN & PM (3x/day)", duration: "2 weeks", notes: "Antifungal — apply on affected area" },
  { name: "Cloxacillin 500mg", dosage: "500mg, 1 tab", frequency: "AM, NN & PM (3x/day)", duration: "7 days", notes: "Antibiotic" },
  { name: "Fluconazole 150mg (Fleozol)", dosage: "150mg, 1 tab", frequency: "NN, 1x/day", duration: "6 weeks", notes: "Antifungal — once a week" },
  { name: "Clotrimazole Ear Drops (Candiva)", dosage: "4 drops", frequency: "AM, NN & PM (3x/day)", duration: "7 days", notes: "Antifungal — for affected ear" },
  { name: "Clindamycin 300mg (Clindaxin)", dosage: "300mg, 1 tab", frequency: "AM, NN & PM (3x/day)", duration: "7 days", notes: "Antibiotic" },
  { name: "Mupirocin Ointment (Bactreat)", dosage: "Apply thin layer", frequency: "AM, NN & PM (3x/day)", duration: "1 week", notes: "Antibiotic ointment — apply on affected area" },
  { name: "Tetanus Toxoid Vial", dosage: "1 vial", frequency: "Single dose", duration: "One-time", notes: "Injected on right deltoid area" },
  { name: "Tetanus Immunoglobulin 1500 IU", dosage: "1 vial", frequency: "Single dose", duration: "One-time", notes: "Injected on left deltoid area" },
  { name: "Silver Sulfadiazine Cream", dosage: "Apply thin layer", frequency: "AM, NN & PM (3x/day)", duration: "1 week", notes: "Apply on affected area" },
  { name: "Budesonide nebule", dosage: "1 nebule", frequency: "NN, 1x/day", duration: "5 days", notes: "Pampaluwag ng daluyan ng hangin — for breathing" },
  { name: "Seretide 50mcg/250mcg", dosage: "1 puff/dose", frequency: "AM & PM (2x/day)", duration: "7 days", notes: "" },
  { name: "Montelukast 10mg (Aurohex)", dosage: "10mg, 1 tab", frequency: "PM, 1x/day", duration: "30 days", notes: "For asthma & allergy" },
  { name: "Lactulose Syrup", dosage: "30mL", frequency: "PM, 1x/day", duration: "As needed", notes: "Stool softener — for constipation" },
  { name: "Bifilac", dosage: "1 sachet/cap", frequency: "NN, 1x/day", duration: "5 days", notes: "Probiotic" },
  { name: "Pantoprazole 40mg (Pantopraz)", dosage: "40mg, 1 tab", frequency: "AM, 1x/day", duration: "7 days", notes: "For stomach pain, vomiting & dizziness — 30 min before breakfast" },
  { name: "Gut Biota", dosage: "1 sachet/tab", frequency: "NN, 1x/day", duration: "7 days", notes: "Probiotic" },
  { name: "Omeprazole 40mg (Mepracid)", dosage: "40mg, 1 tab", frequency: "AM, 1x/day", duration: "7 days", notes: "For stomach pain, vomiting & dizziness — 30 min before breakfast" },
  { name: "Omeprazole 20mg (Mepracid)", dosage: "20mg, 1 tab", frequency: "AM, 1x/day", duration: "7 days", notes: "For stomach pain, vomiting & dizziness — 30 min before breakfast" },
  { name: "Aciclovir 800mg", dosage: "800mg, 1 tab", frequency: "", duration: "4x a day for 7 days", notes: "Antiviral" },
  { name: "Gabapentin 300mg", dosage: "1 tab", frequency: "", duration: "Titrate: Day 1 – NN only (1x/day); Day 2 – AM & PM (2x/day); Day 3–6 – AM, NN & PM (3x/day); Day 7–10 – 4x/day", notes: "Para sa nerve pain" },
  { name: "Tobramycin Ophthalmic Drops", dosage: "1-2 drops", frequency: "", duration: "Every 4 hours for 7 days", notes: "Antibiotic — for affected eye" },
  { name: "Hypromellose", dosage: "1 drop", frequency: "AM, NN & PM (3x/day)", duration: "As needed", notes: "For dry eyes" },
  { name: "HRZE (Fixcom 4)", dosage: "3 tabs", frequency: "NN, 1x/day", duration: "2 months", notes: "Para sa TB — 1 hour before meal" },
  { name: "Vitamin B Complex", dosage: "1 tab", frequency: "NN, 1x/day", duration: "2 months", notes: "Supplement" },
  { name: "Losartan 50mg", dosage: "50mg, 1 tab", frequency: "AM, 1x/day", duration: "30 days", notes: "Para sa hypertension" },
  { name: "Irbesartan 150mg", dosage: "150mg, 1 tab", frequency: "AM, 1x/day", duration: "30 days", notes: "Para sa hypertension" },
  { name: "Amlodipine 5mg (Ambloc)", dosage: "5mg, 1 tab", frequency: "PM, 1x/day", duration: "30 days", notes: "Para sa hypertension" },
  { name: "Amlodipine 10mg (Ambloc)", dosage: "10mg, 1 tab", frequency: "PM, 1x/day", duration: "30 days", notes: "Para sa hypertension" },
  { name: "Telmisartan 40mg + HCTZ 12.5mg (Telxibloc)", dosage: "1 tab", frequency: "AM, 1x/day", duration: "30 days", notes: "Para sa hypertension" },
  { name: "Lercanidipine 10mg (Zanidip)", dosage: "10mg, 1 tab", frequency: "PM, 1x/day", duration: "30 days", notes: "Para sa hypertension" },
  { name: "Atorvastatin 10mg", dosage: "10mg, 1 tab", frequency: "PM, 1x/day", duration: "30 days", notes: "Para sa cholesterol" },
  { name: "Atorvastatin 20mg", dosage: "20mg, 1 tab", frequency: "PM, 1x/day", duration: "30 days", notes: "Para sa cholesterol" },
  { name: "Captopril 25mg", dosage: "25mg, 1 tab", frequency: "AM, 1x/day", duration: "30 days", notes: "Para sa hypertension" },
  { name: "Rosuvastatin 10mg (Rosusta)", dosage: "10mg, 1 tab", frequency: "PM, 1x/day", duration: "30 days", notes: "Para sa cholesterol" },
  { name: "Fenofibrate 160mg (Lipiduce)", dosage: "160mg, 1 tab", frequency: "PM, 1x/day", duration: "30 days", notes: "Para sa triglycerides" },
  { name: "Clonidine 75mcg", dosage: "1 tab", frequency: "", duration: "As needed", notes: "Para sa hypertension — 1 tablet under the tongue" },
  { name: "Metformin 500mg", dosage: "500mg, 1 tab", frequency: "AM & PM (2x/day)", duration: "30 days", notes: "Para sa diabetes" },
  { name: "Gliclazide 30mg", dosage: "30mg, 1 tab", frequency: "AM, 1x/day", duration: "30 days", notes: "Para sa diabetes" },
  { name: "Gliclazide 80mg", dosage: "80mg, 1 tab", frequency: "AM, 1x/day", duration: "30 days", notes: "Para sa diabetes" },
  { name: "Sitagliptin 100mg (Sitplixin)", dosage: "100mg, 1 tab", frequency: "AM, 1x/day", duration: "30 days", notes: "Para sa diabetes" },
  { name: "Sitagliptin 50mg + Metformin 1g (Torsit M)", dosage: "1 tab", frequency: "AM, 1x/day", duration: "30 days", notes: "Para sa diabetes" },
  { name: "Glimeperide 1mg", dosage: "1mg, 1 tab", frequency: "AM, 1x/day", duration: "30 days", notes: "Para sa diabetes" },
  { name: "Glimeperide 2mg", dosage: "2mg, 1 tab", frequency: "AM, 1x/day", duration: "30 days", notes: "Para sa diabetes" },
  { name: "Glimeperide 3mg", dosage: "3mg, 1 tab", frequency: "AM, 1x/day", duration: "30 days", notes: "Para sa diabetes" },
  { name: "Glimeperide 4mg", dosage: "4mg, 1 tab", frequency: "AM, 1x/day", duration: "30 days", notes: "Para sa diabetes" },
  { name: "Empagliflozin 10mg", dosage: "10mg, 1 tab", frequency: "AM, 1x/day", duration: "30 days", notes: "Para sa diabetes" },
  { name: "Empagliflozin 25mg", dosage: "25mg, 1 tab", frequency: "AM, 1x/day", duration: "30 days", notes: "Para sa diabetes" },
  { name: "Dapagliflozin 10mg (Cardiogly)", dosage: "10mg, 1 tab", frequency: "AM, 1x/day", duration: "30 days", notes: "Para sa diabetes" },
  { name: "Clopidogrel 75mg", dosage: "75mg, 1 tab", frequency: "NN, 1x/day", duration: "30 days", notes: "Pampalabnaw ng dugo (blood thinner)" },
  { name: "Aspirin 80mg", dosage: "80mg, 1 tab", frequency: "NN, 1x/day", duration: "30 days", notes: "Pampalabnaw ng dugo (blood thinner)" },
  { name: "Atorvastatin 40mg", dosage: "40mg, 1 tab", frequency: "PM, 1x/day", duration: "30 days", notes: "Para sa cholesterol" },
  { name: "ISMN 30mg (Ismodin)", dosage: "30mg, 1 tab", frequency: "NN, 1x/day", duration: "30 days", notes: "Para sa kirot ng dibdib (chest pain)" },
  { name: "Trimetazidine 35mg", dosage: "35mg, 1 tab", frequency: "NN, 1x/day", duration: "30 days", notes: "Para sa kirot ng dibdib (chest pain)" },
  { name: "Citicoline 500mg (Neulon)", dosage: "500mg, 1 tab", frequency: "AM & PM (2x/day)", duration: "30 days", notes: "Para sa stroke" },
  { name: "Levodopa 100mg + Carbidopa 25mg", dosage: "1 tab", frequency: "NN, 1x/day", duration: "30 days", notes: "" },
  { name: "Apixaban 2.5mg (Apixastal)", dosage: "2.5mg, 1 tab", frequency: "NN, 1x/day", duration: "30 days", notes: "Pampalabnaw ng dugo (blood thinner)" },
  { name: "Eperisone 50mg", dosage: "50mg, 1 tab", frequency: "AM, NN & PM (3x/day)", duration: "5 days", notes: "Muscle relaxant" },
  { name: "Diclofenac 50mg", dosage: "50mg, 1 tab", frequency: "AM, NN & PM (3x/day)", duration: "As needed", notes: "Pain reliever" },
  { name: "Diclofenac Spray (Acuflam)", dosage: "Apply thin layer", frequency: "AM, NN & PM (3x/day)", duration: "As needed", notes: "For pain" },
  { name: "Celecoxib 200mg", dosage: "200mg, 1 tab", frequency: "AM & PM (2x/day)", duration: "As needed", notes: "Pain reliever" },
  { name: "Pregabalin 75mg", dosage: "75mg, 1 tab", frequency: "NN, 1x/day", duration: "30 days", notes: "Pain reliever" },
  { name: "Genacol Capsule", dosage: "3 caps", frequency: "AM, 1x/day", duration: "30 days", notes: "" },
  { name: "Collagen Tablet", dosage: "3 tabs", frequency: "AM & PM (2x/day)", duration: "Daily", notes: "" },
  { name: "Febuxostat 40mg (Febutor)", dosage: "40mg, 1 tab", frequency: "NN, 1x/day", duration: "30 days", notes: "Pampababa ng uric acid" },
  { name: "Febuxostat 80mg (Febutor)", dosage: "80mg, 1 tab", frequency: "NN, 1x/day", duration: "30 days", notes: "Pampababa ng uric acid" },
  { name: "Allopurinol 100mg", dosage: "100mg, 1 tab", frequency: "NN, 1x/day", duration: "90 days", notes: "Pampababa ng uric acid" },
  { name: "Colchicine 500mcg", dosage: "500mcg, 1 tab", frequency: "AM, NN & PM (3x/day)", duration: "5 days", notes: "Para sa kirot at pampababa ng uric acid" },
  { name: "Etoricoxib 90mg", dosage: "90mg, 1 tab", frequency: "NN, 1x/day", duration: "As needed", notes: "Pain reliever — after meal" },
  { name: "Furosemide 20mg", dosage: "20mg, 1 tab", frequency: "NN, 1x/day", duration: "30 days", notes: "Para sa hypertension, hingal at manas (edema)" },
  { name: "Furosemide 40mg", dosage: "40mg, 1 tab", frequency: "NN, 1x/day", duration: "30 days", notes: "Para sa hypertension, hingal at manas (edema)" },
  { name: "Spironolactone 25mg", dosage: "25mg, 1 tab", frequency: "NN, 1x/day", duration: "30 days", notes: "Para sa hypertension, hingal at manas (edema)" },
  { name: "Spironolactone 50mg", dosage: "50mg, 1 tab", frequency: "NN, 1x/day", duration: "30 days", notes: "Para sa hypertension, hingal at manas (edema)" },
  { name: "Spironolactone 100mg", dosage: "100mg, 1 tab", frequency: "NN, 1x/day", duration: "30 days", notes: "Para sa hypertension, hingal at manas (edema)" },
  { name: "Hydrochlorothiazide 12.5mg", dosage: "12.5mg, 1 tab", frequency: "AM, 1x/day", duration: "30 days", notes: "Para sa hypertension, hingal at manas (edema)" },
  { name: "Hydrochlorothiazide 25mg", dosage: "25mg, 1 tab", frequency: "AM, 1x/day", duration: "30 days", notes: "Para sa hypertension, hingal at manas (edema)" },
  { name: "Valsartan 80mg Hydrochlorothiazide 12.5mg (Duoval)", dosage: "1 tab", frequency: "AM, 1x/day", duration: "30 days", notes: "Para sa hypertension, hingal at manas (edema)" },
  { name: "Valsartan 160mg Hydrochlorothiazide 12.5mg (Duoval Max)", dosage: "1 tab", frequency: "AM, 1x/day", duration: "30 days", notes: "Para sa hypertension, hingal at manas (edema)" },
  { name: "Metoprolol 50mg", dosage: "50mg, 1 tab", frequency: "NN, 1x/day", duration: "30 days", notes: "" },
  { name: "Metoprolol 100mg", dosage: "100mg, 1 tab", frequency: "NN, 1x/day", duration: "30 days", notes: "" },
  { name: "Carvedilol 6.25mg", dosage: "6.25mg, 1 tab", frequency: "NN, 1x/day", duration: "30 days", notes: "" },
  { name: "Carvedilol 12.5mg", dosage: "12.5mg, 1 tab", frequency: "NN, 1x/day", duration: "30 days", notes: "" },
  { name: "Propranolol 10mg", dosage: "10mg, 1 tab", frequency: "NN, 1x/day", duration: "30 days", notes: "Para sa hypertension at palpitation" },
  { name: "Propranolol 40mg", dosage: "40mg, 1 tab", frequency: "NN, 1x/day", duration: "30 days", notes: "Para sa hypertension at palpitation" },
  { name: "Nebivolol 5mg", dosage: "5mg, 1 tab", frequency: "NN, 1x/day", duration: "30 days", notes: "Para sa hypertension at palpitation" },
  { name: "Propylthiouracil 50mg", dosage: "50mg, 1 tab", frequency: "AM, NN & PM (3x/day)", duration: "30 days", notes: "For hyperthyroidism" },
  { name: "Methimazole 5mg", dosage: "5mg, 1 tab", frequency: "NN, 1x/day", duration: "30 days", notes: "For hyperthyroidism" },
  { name: "Methimazole 20mg", dosage: "20mg, 1 tab", frequency: "NN, 1x/day", duration: "30 days", notes: "For hyperthyroidism" },
  { name: "Levothyroxine 25mcg / 100mcg", dosage: "1 tab", frequency: "AM, 1x/day", duration: "30 days", notes: "For hypothyroidism — before meal" },
  { name: "Ketoanalogue (Aminolog)", dosage: "1 tab", frequency: "AM, NN & PM (3x/day)", duration: "30 days", notes: "Pampababa ng Creatinine" },
  { name: "Renanon", dosage: "1 tab", frequency: "NN, 1x/day", duration: "30 days", notes: "Pampababa ng Creatinine" },
  { name: "Ursodeoxycholic Acid 300mg (Ursomax)", dosage: "300mg, 1 tab", frequency: "AM, NN & PM (3x/day)", duration: "30 days", notes: "Pampatunaw ng bato sa apdo at sa fatty liver" },
  { name: "Vitamin E Ademetionine 500mg", dosage: "500mg, 1 tab", frequency: "AM, 1x/day", duration: "3 months", notes: "" },
  { name: "Ademetionine 500mg", dosage: "500mg, 1 tab", frequency: "AM, 1x/day", duration: "3 months", notes: "Para sa fatty liver; pampatunaw ng bato sa apdo" },
  { name: "Betahistine 24mg (Vercore)", dosage: "24mg, 1 tab", frequency: "NN, 1x/day", duration: "As needed", notes: "Para sa hilo (dizziness)" },
  { name: "Cinnarizine 25mg (Dizzinon)", dosage: "25mg, 1 tab", frequency: "AM, NN & PM (3x/day)", duration: "As needed", notes: "Para sa hilo (dizziness)" },
  { name: "Flunarizine 5mg (Flumig)", dosage: "5mg, 1 tab", frequency: "PM, 1x/day", duration: "As needed", notes: "Para sa migraine" },
  { name: "Diosmin 450mg + Hesperidin 50mg (Diosper)", dosage: "1 tab", frequency: "NN, 1x/day", duration: "14 days", notes: "Para sa almoranas (hemorrhoids)" },
  { name: "Policresulen + Cinchocaine Ointment (Faktu)", dosage: "Apply thin layer", frequency: "AM, NN & PM (3x/day)", duration: "7 days", notes: "Para sa sakit ng almoranas — apply on affected area" },
  { name: "Tranexamic Acid 500mg", dosage: "500mg, 1 tab", frequency: "AM, NN & PM (3x/day)", duration: "5 days, then PRN", notes: "Pampaampat ng dugo (for bleeding)" },
  { name: "Sulodexide 250mg LSU (Vessel Due-F)", dosage: "250mg LSU, 1 cap", frequency: "NN, 1x/day", duration: "30 days", notes: "Antithrombotic" },
  { name: "Tamsulosin 400mcg", dosage: "400mcg, 1 cap", frequency: "NN, 1x/day", duration: "90 days", notes: "Para sa prostate" },
  { name: "Finasteride 5mg", dosage: "5mg, 1 tab", frequency: "NN, 1x/day", duration: "90 days", notes: "Para sa prostate" },
];

const COMMON_MEDS_PEDS = [
  { name: "Cefpodoxime 100mg/5mL (Swich)", dosage: "1.5mL", frequency: "AM & PM (2x/day)", duration: "7 days", notes: "Antibiotic — after meals" },
  { name: "Cefuroxime 250mg/5mL (Eroxime)", dosage: "1.5mL", frequency: "AM & PM (2x/day)", duration: "7 days", notes: "Antibiotic — after meals" },
  { name: "Cefixime 100mg/5mL (Zelpis)", dosage: "1.5mL", frequency: "AM & PM (2x/day)", duration: "7 days", notes: "Antibiotic — after meals" },
  { name: "N-Acetylcysteine 200mg", dosage: "1 tab/sachet", frequency: "AM & PM (2x/day)", duration: "7 days", notes: "Pampatunaw ng plema (mucolytic) — before bedtime" },
  { name: "Cetirizine 5mg/5mL (Cetzy)", dosage: "5mL", frequency: "PM, 1x/day", duration: "7 days", notes: "For colds / allergy" },
  { name: "Salbutamol nebule + 1mL Sodium Chloride", dosage: "1 nebule + 1mL NSS", frequency: "AM, NN & PM (3x/day)", duration: "5 days", notes: "For difficulty breathing" },
  { name: "Oregano Syrup", dosage: "5mL", frequency: "AM, NN & PM (3x/day)", duration: "5 days", notes: "For cough" },
  { name: "Prednisone 10mg/5mL", dosage: "5mL", frequency: "NN, 1x/day", duration: "5 days", notes: "Anti-inflammatory (duration/remarks blank in source — confirm before dispensing)" },
  { name: "Prednisolone 20mg/5mL (Medsone)", dosage: "5mL", frequency: "NN, 1x/day", duration: "5 days", notes: "Anti-inflammatory — after meals" },
  { name: "Salbutamol for nebulization (Ventar) + 1mL Sodium Chloride", dosage: "1mL + 1mL NSS", frequency: "AM, NN & PM (3x/day)", duration: "4 days or PRN", notes: "For difficulty breathing" },
  { name: "Vitamin C + Zinc (Pediafortan C Plus)", dosage: "5mL", frequency: "NN, 1x/day", duration: "30 days", notes: "" },
  { name: "Multivitamins + Iron", dosage: "5mL", frequency: "NN, 1x/day", duration: "30 days", notes: "" },
  { name: "Ambroxol Drops", dosage: "1mL", frequency: "AM, NN & PM (3x/day)", duration: "5 days", notes: "For phlegm" },
  { name: "Paracetamol 250mg/5mL", dosage: "5mL", frequency: "Every 4 hours, PRN", duration: "As needed", notes: "For fever or pain" },
  { name: "Co-Amoxiclav 457mg/5mL (Clavoxtin)", dosage: "2.5mL", frequency: "AM, NN & PM (3x/day)", duration: "7 days", notes: "Antibiotic — after meals" },
  { name: "Co-Amoxiclav 156.25mg/5mL (Colav)", dosage: "2.5mL", frequency: "AM, NN & PM (3x/day)", duration: "7 days", notes: "Antibiotic — after meals" },
  { name: "Co-Amoxiclav 312.5mg/5mL (Colav)", dosage: "2.5mL", frequency: "AM, NN & PM (3x/day)", duration: "7 days", notes: "Antibiotic — after meals" },
  { name: "Amoxicillin 100mg/mL", dosage: "0.6mL", frequency: "AM, NN & PM (3x/day)", duration: "7 days", notes: "Antibiotic" },
  { name: "Cetirizine 2.5mg/mL", dosage: "mL (see chart)", frequency: "PM, 1x/day", duration: "7 days", notes: "For colds / allergy" },
  { name: "Vitamin C + Zinc (Orazinc Plus)", dosage: "mL (see chart)", frequency: "NN, 1x/day", duration: "30 days", notes: "For resistance / immune support" },
  { name: "Multivitamins", dosage: "mL (see chart)", frequency: "NN, 1x/day", duration: "30 days", notes: "Supplement" },
  { name: "Guaifenesin + Phenylpropanolamine + Chlorphenamine", dosage: "2.5mL", frequency: "AM, NN & PM (3x/day)", duration: "7 days", notes: "For cough, colds & allergy" },
  { name: "Guaifenesin + Salbutamol", dosage: "5mL", frequency: "AM, NN & PM (3x/day)", duration: "5 days", notes: "For phlegm & to loosen airways" },
  { name: "Phenylephrine + Brompheniramine Syrup (Congestap)", dosage: "5mL", frequency: "AM, NN & PM (3x/day)", duration: "5 days", notes: "For colds" },
  { name: "Oral Rehydration Salt Solution (Vivalyte)", dosage: "1 sachet", frequency: "AM, NN & PM (3x/day)", duration: "As needed", notes: "Consume 3 sachets in a day" },
  { name: "Dibencozide 3mg (Heraclene Forte)", dosage: "3mg, 1 tab", frequency: "NN, 1x/day", duration: "30 days", notes: "Pampagana kumain (appetite stimulant)" },
  { name: "Metronidazole 125mg/5mL", dosage: "mL (see chart)", frequency: "AM, NN & PM (3x/day)", duration: "7 days", notes: "Antibiotic — after meals" },
  { name: "Cefaclor 250mg/5mL", dosage: "mL (see chart)", frequency: "AM, NN & PM (3x/day)", duration: "7 days", notes: "Antibiotic — after meals" },
  { name: "Albendazole 400mg", dosage: "1 tablet", frequency: "Once daily", duration: "1 day", notes: "Deworming" },
  { name: "Racecadotril 30mg", dosage: "1 sachet/tab", frequency: "AM, NN & PM (3x/day)", duration: "Until 2 formed stools", notes: "Pampabuo ng dumi — for diarrhea" },
  { name: "Bacillus Clausii (BifiKid)", dosage: "1 vial/sachet", frequency: "AM & PM (2x/day)", duration: "5 days", notes: "Probiotic — 1 hr after antibiotics" },
  { name: "Bacillus Clausi Chewable (Proguthera)", dosage: "1 tab", frequency: "AM & PM (2x/day)", duration: "5 days", notes: "Probiotic — 1 hr after antibiotics" },
  { name: "Lactobacillus reuteri", dosage: "5 drops/mL", frequency: "NN, 1x/day", duration: "5 days", notes: "Probiotic" },
  { name: "Glycerin Pedia Suppository", dosage: "1 suppository", frequency: "NN, as needed", duration: "As needed", notes: "For constipation" },
  { name: "Zinc Gluconate 70mg/5mL", dosage: "mL (see chart)", frequency: "AM & PM (2x/day)", duration: "30 days", notes: "Supplement" },
  { name: "Domperidone 5mg/5mL", dosage: "mL (see chart)", frequency: "AM, NN & PM (3x/day)", duration: "As needed", notes: "For vomiting" },
  { name: "Metoclopromide 5mg/5mL", dosage: "mL (see chart)", frequency: "AM, NN & PM (3x/day)", duration: "As needed", notes: "For vomiting" },
  { name: "Gut Biota", dosage: "1 sachet/tab", frequency: "NN, 1x/day", duration: "7 days", notes: "Probiotic" },
  { name: "Aluminum + Magnesium + Simethicone", dosage: "10mL", frequency: "AM, NN & PM (3x/day)", duration: "5 days", notes: "For stomach pain — after meals" },
  { name: "Budesonide nebule", dosage: "1 nebule", frequency: "NN, 1x/day", duration: "5 days", notes: "Pampaluwag ng daluyan ng hangin — for breathing" },
  { name: "Montelukast 4mg", dosage: "1 tab", frequency: "PM, 1x/day", duration: "30 days", notes: "For asthma & allergy" },
  { name: "Lactulose Syrup", dosage: "10mL", frequency: "PM, 1x/day", duration: "As needed", notes: "Stool softener — for constipation" },
  { name: "Dicycloverine 10mg/5mL", dosage: "5mL", frequency: "AM, NN & PM (3x/day)", duration: "As needed", notes: "For tummy pain" },
  { name: "Esomeprazole 10mg sachet", dosage: "1 sachet", frequency: "AM, 1x/day", duration: "7 days", notes: "For hyperacidity/stomach pain — 30 min before breakfast" },
  { name: "Clindamycin 75mg/5mL", dosage: "10mL", frequency: "AM, NN & PM (3x/day)", duration: "7 days", notes: "Antibiotic" },
  { name: "Mupirocin Ointment", dosage: "Apply thin layer", frequency: "AM, NN & PM (3x/day)", duration: "2 weeks", notes: "Antibiotic ointment — apply on affected area" },
  { name: "Cloxacillin 250mg/5mL (Clozac)", dosage: "mL (see chart)", frequency: "AM, NN & PM (3x/day)", duration: "7 days", notes: "Antibiotic" },
  { name: "Clotrimazole Cream", dosage: "Apply thin layer", frequency: "AM, NN & PM (3x/day)", duration: "2 weeks", notes: "Antifungal — apply on affected area" },
  { name: "Physiogel Ai Cream", dosage: "Apply thin layer", frequency: "AM & PM (2x/day)", duration: "Daily", notes: "Moisturizer" },
  { name: "Miconazole Oral Gel (Daktarin)", dosage: "1 application", frequency: "AM, NN & PM (3x/day)", duration: "7 days", notes: "Antifungal — apply over the mouth after meals" },
  { name: "Ketoconazole Shampoo", dosage: "1 sachet", frequency: "3x a week", duration: "1 month, then once/week for 2 months", notes: "Antifungal" },
  { name: "PND (Polymyxin B, Neomycin, Dexamethasone) Otic Drops", dosage: "4 drops", frequency: "AM, NN & PM (3x/day)", duration: "7 days", notes: "For affected ear" },
  { name: "Gentamicin Otic Drops", dosage: "3 drops", frequency: "AM, NN & PM (3x/day)", duration: "7 days", notes: "For affected ear" },
  { name: "Ofloxacin Otic Drops", dosage: "5 drops", frequency: "AM, NN & PM (3x/day)", duration: "7 days", notes: "For affected ear" },
];

// Used to seed the database the first time the app runs — after that, the
// database is the source of truth and these are never read again.
const defaultCommonMeds = () => {
  const merged = [...COMMON_MEDS_ADULT, ...COMMON_MEDS_PEDS];
  const seen = new Set();
  return merged.filter((m) => {
    const key = m.name.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// One starter template built from the clinic's own pediatric pneumonia/URTI pad —
// everything else starts empty; add more from the new "Rx Templates" page in-app.
const defaultRxTemplates = () => [
  {
    id: "seed-pcap-ab",
    label: "PCAP A-B",
    meds: [
      { name: "Cefuroxime 250mg/5mL (Eoroxime)", qty: "1", am: "1.5mL", nn: "0", pm: "1.5mL", remarks: "for 7 days after meals" },
      { name: "Co-Amoxiclav 312.5mg/5mL", qty: "1", am: "1.5mL", nn: "1.5mL", pm: "1.5mL", remarks: "for 7 days after meals" },
      { name: "Cefixime 100mg/5mL (Zelpis)", qty: "1", am: "1.5mL", nn: "0", pm: "1.5mL", remarks: "for 7 days after meals" },
      { name: "N-Acetylcysteine 200mg", qty: "10", am: "1", nn: "0", pm: "1", remarks: "for 5 days" },
      { name: "Cetirizine 5mg/5mL (Cetzy)", qty: "1", am: "0", nn: "0", pm: "", remarks: "for 7 days" },
      { name: "Salbutamol nebule + 1mL Sodium Chloride", qty: "15", am: "1", nn: "1", pm: "1", remarks: "for 5 days" },
      { name: "Prednisolone 20mg/5mL (Medsone)", qty: "1", am: "0", nn: "", pm: "0", remarks: "for 5 days after meals" },
      { name: "Vitamin C + Zinc (Pediafortan C Plus)", qty: "2", am: "0", nn: "1", pm: "0", remarks: "for 30 days" },
      { name: "Multivitamins + Iron", qty: "2", am: "0", nn: "", pm: "0", remarks: "for 30 days" },
      { name: "Paracetamol 250mg/5mL", qty: "1", am: "", nn: "", pm: "", remarks: "every 4 hours for fever or pain" },
      { name: "Oral Rehydration Salt Solution (Vivalyte)", qty: "9", am: "1", nn: "1", pm: "1", remarks: "consume 3 sachets in a day" },
      { name: "Guaifenesin + Phenylpropanolamine + Chlorphenamine", qty: "1", am: "2.5mL", nn: "2.5mL", pm: "2.5mL", remarks: "for 7 days" },
      { name: "Guaifenesin + Salbutamol", qty: "1", am: "5mL", nn: "5mL", pm: "5mL", remarks: "for 5 days" },
      { name: "Phenylephrine, Brompheniramine Syrup (Congestap)", qty: "1", am: "5mL", nn: "5mL", pm: "5mL", remarks: "for 5 days" },
      { name: "Dibencozide 3mg (Heraclene Forte)", qty: "90", am: "0", nn: "1", pm: "0", remarks: "for 30 days" },
    ],
  },
];

// Saved bundles of commonly-requested lab/diagnostic tests — starts empty, built entirely in-app.
const defaultLabTemplates = () => [];

/* ---------------- Physical exam checklist items (from clinic exam form) ---------------- */
const SYMPTOM_CHECKLIST = [
  "Abdominal pains", "Allergies", "Bleeding tendency", "Bloody or Black Stool",
  "Blurring of vision/Eye problem", "Chest pain/Heaviness/Palpitation", "Constipation/Diarrhea",
  "Dizziness or Balance Problem", "Easily tires on ordinary activity/Walking", "Elevated blood pressure",
  "Elevated blood sugar", "Exposure to Tuberculosis", "Feet swelling/Joint swelling",
  "Frequent Headache/Migraine", "Genital organ problem/Discharges", "Hearing defect/Ear problem",
  "Loss of appetite", "Loss of consciousness", "Nervousness/Depression", "Persistent Cough",
  "Shortness of Breath", "Sleeping problems", "Skin problem/Cyst/Lump/Mass", "Sore throat/Colds/Sneezing",
  "Urination problem", "Weakness/Paralysis/Numbness/Tremors", "Weight loss/Weight gain", "Yellowing of skin or eyes",
];

const PAST_HISTORY_CHECKLIST = [
  "Hypertension", "Diabetes Mellitus", "Bronchial Asthma", "Malignancy", "Heart Disease",
  "Hepatitis", "Measles", "Mumps", "Primary Complex", "Chicken Pox", "Tuberculosis",
];

const FAMILY_HISTORY_CHECKLIST = [
  "Asthma", "Diabetes Mellitus", "Goiter", "Heart Disease", "Hypertension (BP 140/90 and above)",
  "Kidney Disease", "Psychiatric Problem", "Pulmonary Tuberculosis",
];

/* ---------------- Laboratory & diagnostic test checklist (from clinic lab request pad) ---------------- */
const LAB_TEST_CHECKLIST = [
  "CBC", "Urinalysis", "Fecalysis", "FBS", "HbA1C", "Lipid Profile", "Cholesterol", "Triglycerides",
  "BUN", "Creatinine", "Uric Acid", "SGPT", "SGOT", "Sodium", "Potassium", "ECG", "2D Echo",
  "Thyroid Function Test", "TSH", "FT3", "FT4",
  "Chest Xray", "Sputum GeneXpert", "PPD Test", "Prothrombin Time", "Partial Thromboplastin Time",
  "Troponin I", "CK-MB", "ESR", "CRP", "ANA", "Pregnancy Test", "Fecal Occult Blood Test",
  "ABO RH Typing", "HbsAg screening", "VDRL screening", "HIV Screening",
];
// These four need a companion blank (e.g. "Xray: chest, lateral view") rather than a plain checkbox.
const LAB_TEST_WITH_DETAIL = ["Xray", "Ultrasound", "CT-Scan", "Others"];

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function calcAge(dobStr) {
  if (!dobStr) return null;
  const dob = new Date(dobStr);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

function fmtDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function fmtDateTime(d) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

/* ---------------- Pulse divider (signature element) ---------------- */
function PulseDivider() {
  return (
    <div className="pulse-wrap" aria-hidden="true">
      <svg viewBox="0 0 600 40" preserveAspectRatio="none" className="pulse-svg">
        <line x1="0" y1="20" x2="600" y2="20" className="pulse-baseline" />
        <path
          className="pulse-line"
          d="M0,20 L230,20 L250,4 L266,36 L282,20 L300,20 L312,20 L322,8 L334,20 L600,20"
          fill="none"
        />
      </svg>
      <style>{`
        .pulse-wrap { width: 100%; overflow: hidden; height: 20px; }
        .pulse-svg { width: 100%; height: 20px; display: block; }
        .pulse-baseline { stroke: #DCE3E1; stroke-width: 1; }
        .pulse-line {
          stroke: #0F5E56;
          stroke-width: 1.75;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: 900;
          stroke-dashoffset: 900;
          animation: draw 1.6s ease-out forwards;
        }
        @keyframes draw { to { stroke-dashoffset: 0; } }
        @media (prefers-reduced-motion: reduce) {
          .pulse-line { animation: none; stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}

/* ---------------- Storage helpers ---------------- */
async function loadClinicData() {
  const { data, error } = await supabase.from("app_state").select("value").eq("key", "clinic-data").maybeSingle();
  if (error) { console.error("loadClinicData failed", error); return emptyData(); }
  return data ? { ...emptyData(), ...data.value } : emptyData();
}
async function saveClinicData(data) {
  const { error } = await supabase.from("app_state").upsert({ key: "clinic-data", value: data, updated_at: new Date().toISOString() });
  if (error) console.error("saveClinicData failed", error);
}
async function loadClinicInfo() {
  const { data, error } = await supabase.from("app_state").select("value").eq("key", "clinic-info").maybeSingle();
  if (error) { console.error("loadClinicInfo failed", error); return defaultClinicInfo(); }
  return data ? { ...defaultClinicInfo(), ...data.value } : defaultClinicInfo();
}
async function saveClinicInfo(info) {
  const { error } = await supabase.from("app_state").upsert({ key: "clinic-info", value: info, updated_at: new Date().toISOString() });
  if (error) console.error("saveClinicInfo failed", error);
}
async function loadAllStaffProfiles() {
  const { data, error } = await supabase.from("staff_profiles").select("id, name, role");
  if (error) { console.error("loadAllStaffProfiles failed", error); return []; }
  return data || [];
}
async function loadMyProfile(userId) {
  const { data, error } = await supabase.from("staff_profiles").select("id, name, role").eq("id", userId).maybeSingle();
  if (error) { console.error("loadMyProfile failed", error); return null; }
  return data;
}
async function saveMyProfile(userId, name, role) {
  const { error } = await supabase.from("staff_profiles").upsert({ id: userId, name, role });
  if (error) console.error("saveMyProfile failed", error);
}
async function loadCommonMeds() {
  const { data, error } = await supabase.from("app_state").select("value").eq("key", "common-meds").maybeSingle();
  if (error) { console.error("loadCommonMeds failed", error); return defaultCommonMeds(); }
  if (!data) return defaultCommonMeds();
  const v = data.value;
  // Migrate old {adult:[...], peds:[...]} shape (from before the lists were combined)
  // into a single flat list, so nothing entered earlier gets lost.
  if (Array.isArray(v)) return v;
  if (v && (Array.isArray(v.adult) || Array.isArray(v.peds))) {
    const merged = [...(v.adult || []), ...(v.peds || [])];
    const seen = new Set();
    const flat = merged.filter((m) => {
      const key = (m.name || "").trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    await saveCommonMeds(flat); // persist the migration so it only happens once
    return flat;
  }
  return defaultCommonMeds();
}
async function saveCommonMeds(meds) {
  const { error } = await supabase.from("app_state").upsert({ key: "common-meds", value: meds, updated_at: new Date().toISOString() });
  if (error) console.error("saveCommonMeds failed", error);
}
async function loadRxTemplates() {
  const { data, error } = await supabase.from("app_state").select("value").eq("key", "rx-templates").maybeSingle();
  if (error) { console.error("loadRxTemplates failed", error); return defaultRxTemplates(); }
  if (!data) return defaultRxTemplates();
  const v = data.value;
  // Migrate old {adult:[...], peds:[...]} shape into one flat list of templates.
  if (Array.isArray(v)) return v;
  if (v && (Array.isArray(v.adult) || Array.isArray(v.peds))) {
    const flat = [...(v.adult || []), ...(v.peds || [])];
    await saveRxTemplates(flat); // persist the migration so it only happens once
    return flat;
  }
  return defaultRxTemplates();
}
async function saveRxTemplates(templates) {
  const { error } = await supabase.from("app_state").upsert({ key: "rx-templates", value: templates, updated_at: new Date().toISOString() });
  if (error) console.error("saveRxTemplates failed", error);
}
async function loadLabTemplates() {
  const { data, error } = await supabase.from("app_state").select("value").eq("key", "lab-templates").maybeSingle();
  if (error) { console.error("loadLabTemplates failed", error); return defaultLabTemplates(); }
  if (!data) return defaultLabTemplates();
  return Array.isArray(data.value) ? data.value : defaultLabTemplates();
}
async function saveLabTemplates(templates) {
  const { error } = await supabase.from("app_state").upsert({ key: "lab-templates", value: templates, updated_at: new Date().toISOString() });
  if (error) console.error("saveLabTemplates failed", error);
}

/* ---------------- Dose-column & remarks helpers ---------------- */
function deriveDoseSlots(freqText, doseText) {
  const f = freqText || "";
  const amt = doseText || "1";
  const hasAM = /\bAM\b/.test(f);
  const hasNN = /\bNN\b/.test(f);
  const hasPM = /\bPM\b/.test(f);
  if (!hasAM && !hasNN && !hasPM) return { am: "", nn: "", pm: "" };
  return { am: hasAM ? amt : "0", nn: hasNN ? amt : "0", pm: hasPM ? amt : "0" };
}
function buildRemarks(duration, notes) {
  const d = (duration || "").trim();
  const n = (notes || "").trim();
  let base = d;
  if (d && !/^(for|every|as needed|once|apply|\d+x)/i.test(d)) base = `for ${d}`;
  if (base && n) return `${base} — ${n}`;
  return base || n;
}

// Scans chart history (already newest-first) for the most recently recorded value of each
// vital, independently — so if weight was logged two visits ago but BP just now, both still
// show up. Falls back to blank per field if nothing's ever been recorded.
function getLatestVitals(history) {
  const result = { weight: "", bp: "", heartRate: "", temp: "" };
  for (const h of history || []) {
    if (!result.weight && h.weight) result.weight = h.weight;
    if (!result.bp && h.bp) result.bp = h.bp;
    if (!result.heartRate && h.heartRate) result.heartRate = h.heartRate;
    if (!result.temp && h.temp) result.temp = h.temp;
    if (result.weight && result.bp && result.heartRate && result.temp) break;
  }
  return result;
}

/* ================================================================== */

export default function ClinicEMR() {
  const [authLoading, setAuthLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [data, setData] = useState(emptyData());
  const [staffList, setStaffList] = useState([]);
  const [clinicInfo, setClinicInfo] = useState(defaultClinicInfo());
  const [commonMeds, setCommonMeds] = useState(defaultCommonMeds());
  const [rxTemplates, setRxTemplates] = useState(defaultRxTemplates());
  const [labTemplates, setLabTemplates] = useState(defaultLabTemplates());
  const [view, setView] = useState("dashboard");
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [toast, setToast] = useState(null);

  // Watch real login state (persists across refreshes, unlike the old name-picker).
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Once logged in, load this staff member's profile plus the clinic's data.
  // Keyed on the user id (not the whole session object) so a background token
  // refresh doesn't trigger a full reload while someone's mid-task.
  const userId = session?.user?.id || null;
  useEffect(() => {
    if (!userId) { setMyProfile(null); return; }
    (async () => {
      setDataLoading(true);
      const [profile, d, c, allStaff, meds, templates, labTpls] = await Promise.all([
        loadMyProfile(userId),
        loadClinicData(),
        loadClinicInfo(),
        loadAllStaffProfiles(),
        loadCommonMeds(),
        loadRxTemplates(),
        loadLabTemplates(),
      ]);
      setMyProfile(profile);
      setData(d);
      setClinicInfo(c);
      setStaffList(allStaff);
      setCommonMeds(meds);
      setRxTemplates(templates);
      setLabTemplates(labTpls);
      setDataLoading(false);
    })();
  }, [userId]);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  const persistCommonMeds = useCallback(async (next) => {
    setCommonMeds(next);
    await saveCommonMeds(next);
  }, []);

  const persistRxTemplates = useCallback(async (next) => {
    setRxTemplates(next);
    await saveRxTemplates(next);
  }, []);

  const persistLabTemplates = useCallback(async (next) => {
    setLabTemplates(next);
    await saveLabTemplates(next);
  }, []);

  const persist = useCallback(async (next) => {
    setData(next);
    await saveClinicData(next);
  }, []);

  const persistClinicInfo = useCallback(async (next) => {
    setClinicInfo(next);
    await saveClinicInfo(next);
  }, []);

  async function completeProfile(name, role) {
    await saveMyProfile(userId, name, role);
    const me = { id: userId, name, role };
    setMyProfile(me);
    setStaffList((prev) => [...prev.filter((p) => p.id !== userId), me]);
  }

  if (authLoading) {
    return (
      <div style={styles.centerScreen}>
        <div style={styles.loadingPulse}>Loading…</div>
      </div>
    );
  }

  if (!session) return <SignIn />;

  if (dataLoading) {
    return (
      <div style={styles.centerScreen}>
        <div style={styles.loadingPulse}>Loading clinic records…</div>
      </div>
    );
  }

  if (!myProfile) return <CompleteProfile onSave={completeProfile} />;

  const currentUser = myProfile;
  const patient = selectedPatientId
    ? data.patients.find((p) => p.id === selectedPatientId)
    : null;

  return (
    <div style={styles.app}>
      <style>{globalCss}</style>
      <Sidebar
        view={view}
        setView={(v) => {
          setView(v);
          if (v !== "patientDetail") setSelectedPatientId(null);
        }}
        currentUser={currentUser}
        onSignOut={() => supabase.auth.signOut()}
      />
      <main style={styles.main}>
        <TopBar currentUser={currentUser} />
        <PulseDivider />
        <div style={styles.content}>
          <PrivacyBanner />
          {view === "dashboard" && (
            <Dashboard
              data={data}
              onGoPatients={() => setView("patients")}
              onGoSchedule={() => setView("schedule")}
              onOpenPatient={(id) => {
                setSelectedPatientId(id);
                setView("patientDetail");
              }}
            />
          )}
          {view === "schedule" && (
            <Schedule
              data={data}
              persist={persist}
              currentUser={currentUser}
              showToast={showToast}
              onOpenPatient={(id) => {
                setSelectedPatientId(id);
                setView("patientDetail");
              }}
            />
          )}
          {view === "patients" && (
            <PatientsList
              data={data}
              persist={persist}
              showToast={showToast}
              currentUser={currentUser}
              onOpenPatient={(id) => {
                setSelectedPatientId(id);
                setView("patientDetail");
              }}
            />
          )}
          {view === "patientDetail" && patient && (
            <PatientDetail
              patient={patient}
              data={data}
              persist={persist}
              currentUser={currentUser}
              showToast={showToast}
              clinicInfo={clinicInfo}
              commonMeds={commonMeds}
              rxTemplates={rxTemplates}
              labTemplates={labTemplates}
              persistLabTemplates={persistLabTemplates}
              onBack={() => {
                setSelectedPatientId(null);
                setView("patients");
              }}
            />
          )}
          {view === "medications" && (
            <MedicationsPage commonMeds={commonMeds} persistCommonMeds={persistCommonMeds} showToast={showToast} />
          )}
          {view === "templates" && (
            <RxTemplatesPage
              rxTemplates={rxTemplates}
              persistRxTemplates={persistRxTemplates}
              commonMeds={commonMeds}
              showToast={showToast}
            />
          )}
          {view === "staff" && (
            <StaffDirectory
              staffList={staffList}
              showToast={showToast}
              clinicInfo={clinicInfo}
              persistClinicInfo={persistClinicInfo}
            />
          )}
        </div>
      </main>
      {toast && <div style={styles.toast}>{toast}</div>}
    </div>
  );
}

/* ---------------- Sign in (real Supabase Auth) ---------------- */
function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setErrorMsg("");
    if (!email.trim() || !password) return;
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setSubmitting(false);
    if (error) setErrorMsg(error.message);
  }

  return (
    <div style={styles.centerScreen}>
      <style>{globalCss}</style>
      <div style={styles.signInCard}>
        <img src="/logo-full.png" alt="Alba-Aniciete Medical Clinic" style={{ width: 180, display: "block", margin: "0 auto 14px" }} />
        <p style={{ color: "#5B6B68", fontSize: 13.5, marginTop: 2, marginBottom: 18, textAlign: "center" }}>
          Sign in with the email and password your clinic admin set up for you.
        </p>

        <div style={styles.label}>Email</div>
        <input
          style={styles.input}
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        <div style={{ ...styles.label, marginTop: 10 }}>Password</div>
        <input
          style={styles.input}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        {errorMsg && <div style={{ color: "#B23B3B", fontSize: 12.5, marginTop: 10 }}>{errorMsg}</div>}
        <button
          style={{ ...styles.primaryBtn, marginTop: 14, width: "100%", justifyContent: "center" }}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
        <p style={{ color: "#8A9793", fontSize: 11.5, marginTop: 14 }}>
          Don't have a login yet? Ask your clinic admin to create one in the Supabase dashboard.
        </p>
      </div>
    </div>
  );
}

/* ---------------- First-time profile setup ---------------- */
function CompleteProfile({ onSave }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("Physician");
  const [saving, setSaving] = useState(false);

  return (
    <div style={styles.centerScreen}>
      <style>{globalCss}</style>
      <div style={styles.signInCard}>
        <img src="/logo-icon.png" alt="" style={{ width: 40, height: 40, display: "block", margin: "0 auto 12px" }} />
        <div style={{ fontFamily: "Fraunces, serif", fontSize: 20, color: "#12312D", marginBottom: 6, textAlign: "center" }}>
          Welcome — one quick step
        </div>
        <p style={{ color: "#5B6B68", fontSize: 13.5, marginBottom: 18, textAlign: "center" }}>
          This is your first time signing in. How should your name appear on charts and prescriptions?
        </p>
        <div style={styles.label}>Full name</div>
        <input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} />
        <div style={{ ...styles.label, marginTop: 10 }}>Role</div>
        <select style={styles.input} value={role} onChange={(e) => setRole(e.target.value)}>
          <option>Physician</option>
          <option>Pediatrician</option>
          <option>Nurse</option>
          <option>Front Desk / Admin</option>
        </select>
        <button
          style={{ ...styles.primaryBtn, marginTop: 14, width: "100%", justifyContent: "center" }}
          disabled={saving}
          onClick={async () => {
            if (!name.trim()) return;
            setSaving(true);
            await onSave(name.trim(), role);
            setSaving(false);
          }}
        >
          {saving ? "Saving…" : "Continue"}
        </button>
      </div>
    </div>
  );
}
/* ---------------- Privacy banner ---------------- */
function PrivacyBanner() {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div style={styles.banner}>
      <ShieldAlert size={18} color="#8A4B12" style={{ flexShrink: 0, marginTop: 1 }} />
      <div style={{ fontSize: 12.5, color: "#6B4A1F", lineHeight: 1.5 }}>
        <strong>Before trusting this with real patients:</strong> this build now has real login and a real
        database, but no one has audited it for healthcare data compliance (e.g. the Philippines Data
        Privacy Act) — access logs, backup policy, and a legal/compliance review are still worth doing.
        Test thoroughly with fake data first.
      </div>
      <button onClick={() => setOpen(false)} style={styles.bannerClose} aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  );
}

/* ---------------- Sidebar ---------------- */
function Sidebar({ view, setView, currentUser, onSignOut }) {
  const items = [
    { key: "dashboard", label: "Dashboard", icon: Home },
    { key: "schedule", label: "Schedule", icon: CalendarDays },
    { key: "patients", label: "Patients", icon: Users },
    { key: "medications", label: "Medications", icon: Pill },
    { key: "templates", label: "Rx Templates", icon: Layers },
    { key: "staff", label: "Staff", icon: UserRound },
  ];
  return (
    <aside style={styles.sidebar}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "20px 18px 16px" }}>
        <img src="/logo-icon.png" alt="" style={{ width: 26, height: 26, flexShrink: 0 }} />
        <span style={{ fontFamily: "Fraunces, serif", fontSize: 16, color: "#EAF3F1", lineHeight: 1.15 }}>
          Alba-Aniciete
        </span>
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 2, padding: "0 10px" }}>
        {items.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setView(key)}
            style={{
              ...styles.navBtn,
              ...(view === key ? styles.navBtnActive : {}),
            }}
          >
            <Icon size={17} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div style={{ marginTop: "auto", padding: 14, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ fontSize: 12.5, color: "#B9CBC8" }}>{currentUser.name}</div>
        <div style={{ fontSize: 11, color: "#7E948F", marginBottom: 8 }}>{currentUser.role}</div>
        <button onClick={onSignOut} style={styles.signOutBtn}>
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </aside>
  );
}

function TopBar({ currentUser }) {
  const today = new Date();
  return (
    <div style={styles.topBar}>
      <div style={{ fontFamily: "Fraunces, serif", fontSize: 20, color: "#12312D" }}>
        Adult &amp; Pediatric Care
      </div>
      <div style={{ fontSize: 12.5, color: "#5B6B68", fontFamily: "IBM Plex Mono, monospace" }}>
        {today.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
      </div>
    </div>
  );
}

/* ---------------- Dashboard ---------------- */
function Dashboard({ data, onGoPatients, onGoSchedule, onOpenPatient }) {
  const todayStr = new Date().toDateString();
  const todaysAppts = data.appointments
    .filter((a) => new Date(a.date).toDateString() === todayStr)
    .sort((a, b) => a.time.localeCompare(b.time));

  const pedsCount = data.patients.filter((p) => (calcAge(p.dob) ?? 99) < 18).length;
  const adultCount = data.patients.length - pedsCount;

  return (
    <div>
      <div style={styles.statRow}>
        <StatCard label="Total patients" value={data.patients.length} icon={Users} onClick={onGoPatients} />
        <StatCard label="Pediatric" value={pedsCount} icon={Baby} accent="#C97A2B" />
        <StatCard label="Adult" value={adultCount} icon={UserRound} accent="#0F5E56" />
        <StatCard label="Today's visits" value={todaysAppts.length} icon={CalendarDays} onClick={onGoSchedule} />
      </div>

      <SectionCard title="Today's schedule">
        {todaysAppts.length === 0 ? (
          <EmptyState text="No visits scheduled for today." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {todaysAppts.map((a) => {
              const p = data.patients.find((pt) => pt.id === a.patientId);
              return (
                <div key={a.id} style={styles.apptRow} onClick={() => p && onOpenPatient(p.id)}>
                  <span style={styles.mono}>{a.time}</span>
                  <span style={{ flex: 1 }}>{p ? p.name : "Unknown patient"}</span>
                  <span style={styles.pill}>{a.reason || "Visit"}</span>
                  <span style={{ ...styles.pill, background: "#EAF3F1", color: "#0F5E56" }}>{a.provider}</span>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, accent = "#0F5E56", onClick }) {
  return (
    <div style={{ ...styles.statCard, cursor: onClick ? "pointer" : "default" }} onClick={onClick}>
      <div style={{ ...styles.statIconWrap, background: accent + "18", color: accent }}>
        <Icon size={18} />
      </div>
      <div>
        <div style={{ fontSize: 22, fontFamily: "IBM Plex Mono, monospace", color: "#12312D" }}>{value}</div>
        <div style={{ fontSize: 12, color: "#5B6B68" }}>{label}</div>
      </div>
    </div>
  );
}

function SectionCard({ title, action, children }) {
  return (
    <div style={styles.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#12312D" }}>{title}</div>
        {action}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ text }) {
  return <div style={{ color: "#8A9793", fontSize: 13, padding: "14px 0" }}>{text}</div>;
}

/* ---------------- Schedule ---------------- */
function Schedule({ data, persist, currentUser, showToast, onOpenPatient }) {
  const [showForm, setShowForm] = useState(false);
  const [dateFilter, setDateFilter] = useState(() => new Date().toISOString().slice(0, 10));

  const dayAppts = data.appointments
    .filter((a) => a.date === dateFilter)
    .sort((a, b) => a.time.localeCompare(b.time));

  async function addAppt(appt) {
    const next = { ...data, appointments: [...data.appointments, { ...appt, id: uid("appt") }] };
    await persist(next);
    showToast("Appointment scheduled");
    setShowForm(false);
  }

  async function removeAppt(id) {
    const next = { ...data, appointments: data.appointments.filter((a) => a.id !== id) };
    await persist(next);
  }

  return (
    <div>
      <div style={styles.pageHeader}>
        <h2 style={styles.h2}>Schedule</h2>
        <button style={styles.primaryBtn} onClick={() => setShowForm(true)}>
          <Plus size={15} /> New appointment
        </button>
      </div>

      <div style={{ marginBottom: 14 }}>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          style={{ ...styles.input, width: 200 }}
        />
      </div>

      <SectionCard title={fmtDate(dateFilter)}>
        {dayAppts.length === 0 ? (
          <EmptyState text="No appointments on this date." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {dayAppts.map((a) => {
              const p = data.patients.find((pt) => pt.id === a.patientId);
              return (
                <div key={a.id} style={styles.apptRow}>
                  <span style={styles.mono}>{a.time}</span>
                  <span style={{ flex: 1, cursor: "pointer" }} onClick={() => p && onOpenPatient(p.id)}>
                    {p ? p.name : "Unknown patient"}
                  </span>
                  <span style={styles.pill}>{a.reason || "Visit"}</span>
                  <span style={{ ...styles.pill, background: "#EAF3F1", color: "#0F5E56" }}>{a.provider}</span>
                  <button style={styles.iconBtn} onClick={() => removeAppt(a.id)} aria-label="Cancel">
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {showForm && (
        <Modal onClose={() => setShowForm(false)} title="New appointment">
          <ApptForm
            patients={data.patients}
            defaultDate={dateFilter}
            defaultProvider={currentUser.name}
            onSubmit={addAppt}
          />
        </Modal>
      )}
    </div>
  );
}

function ApptForm({ patients, defaultDate, defaultProvider, onSubmit }) {
  const [patientId, setPatientId] = useState(patients[0]?.id || "");
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState("09:00");
  const [provider, setProvider] = useState(defaultProvider);
  const [reason, setReason] = useState("");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {patients.length === 0 ? (
        <div style={{ fontSize: 13, color: "#8A4B12" }}>Add a patient first before scheduling.</div>
      ) : (
        <>
          <Field label="Patient">
            <select style={styles.input} value={patientId} onChange={(e) => setPatientId(e.target.value)}>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </Field>
          <div style={{ display: "flex", gap: 10 }}>
            <Field label="Date" style={{ flex: 1 }}>
              <input type="date" style={styles.input} value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="Time" style={{ flex: 1 }}>
              <input type="time" style={styles.input} value={time} onChange={(e) => setTime(e.target.value)} />
            </Field>
          </div>
          <Field label="Provider">
            <input style={styles.input} value={provider} onChange={(e) => setProvider(e.target.value)} />
          </Field>
          <Field label="Reason for visit">
            <input style={styles.input} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Well-child check, follow-up" />
          </Field>
          <button
            style={{ ...styles.primaryBtn, justifyContent: "center", marginTop: 6 }}
            onClick={() => onSubmit({ patientId, date, time, provider, reason })}
          >
            <Check size={15} /> Schedule
          </button>
        </>
      )}
    </div>
  );
}

/* ---------------- Patients list ---------------- */
function PatientsList({ data, persist, showToast, currentUser, onOpenPatient }) {
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);

  const filtered = data.patients.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  async function addPatient(patient) {
    const newId = uid("pt");
    const auditEntry = { id: uid("audit"), patientId: newId, date: new Date().toISOString(), provider: currentUser.name, action: "patient_created", summary: "Patient record created" };
    const next = { ...data, patients: [...data.patients, { ...patient, id: newId, history: [] }], auditLog: [...(data.auditLog || []), auditEntry] };
    await persist(next);
    showToast("Patient added");
    setShowForm(false);
  }

  return (
    <div>
      <div style={styles.pageHeader}>
        <h2 style={styles.h2}>Patients</h2>
        <button style={styles.primaryBtn} onClick={() => setShowForm(true)}>
          <Plus size={15} /> Add patient
        </button>
      </div>

      <div style={{ position: "relative", marginBottom: 14 }}>
        <Search size={15} style={{ position: "absolute", left: 12, top: 11, color: "#8A9793" }} />
        <input
          style={{ ...styles.input, paddingLeft: 34 }}
          placeholder="Search patients by name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <SectionCard title="No results">
          <EmptyState text={data.patients.length === 0 ? "No patients yet. Add the first one." : "No patients match your search."} />
        </SectionCard>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((p) => {
            const age = calcAge(p.dob);
            const isPeds = age !== null && age < 18;
            return (
              <div key={p.id} style={styles.patientRow} onClick={() => onOpenPatient(p.id)}>
                <div style={{ ...styles.avatarDot, background: isPeds ? "#C97A2B" : "#0F5E56" }}>
                  {isPeds ? <Baby size={14} color="#fff" /> : <UserRound size={14} color="#fff" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: "#12312D" }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: "#5B6B68" }}>
                    {age !== null ? `${age} yrs` : "Age unknown"} · {p.sex || "—"}
                  </div>
                </div>
                {p.allergies && (
                  <span style={styles.allergyTag}>
                    <AlertTriangle size={12} /> Allergy
                  </span>
                )}
                <span style={{ ...styles.pill, fontFamily: "IBM Plex Mono, monospace" }}>{p.id}</span>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <Modal onClose={() => setShowForm(false)} title="Add patient">
          <PatientForm onSubmit={addPatient} />
        </Modal>
      )}
    </div>
  );
}

function PatientForm({ onSubmit, initial, submitLabel = "Save patient" }) {
  const [name, setName] = useState(initial?.name || "");
  const [dob, setDob] = useState(initial?.dob || "");
  const [sex, setSex] = useState(initial?.sex || "Female");
  const [contact, setContact] = useState(initial?.contact || "");
  const [address, setAddress] = useState(initial?.address || "");
  const [guardian, setGuardian] = useState(initial?.guardian || "");
  const [allergies, setAllergies] = useState(initial?.allergies || "");

  const age = calcAge(dob);
  const isPeds = age !== null && age < 18;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <Field label="Full name">
        <input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <div style={{ display: "flex", gap: 10 }}>
        <Field label="Date of birth" style={{ flex: 1 }}>
          <input type="date" style={styles.input} value={dob} onChange={(e) => setDob(e.target.value)} />
        </Field>
        <Field label="Sex" style={{ flex: 1 }}>
          <select style={styles.input} value={sex} onChange={(e) => setSex(e.target.value)}>
            <option>Female</option>
            <option>Male</option>
          </select>
        </Field>
      </div>
      {age !== null && (
        <div style={{ fontSize: 12, color: isPeds ? "#C97A2B" : "#0F5E56" }}>
          {age} years old · classified as {isPeds ? "Pediatric" : "Adult"}
        </div>
      )}
      {isPeds && (
        <Field label="Parent / guardian">
          <input style={styles.input} value={guardian} onChange={(e) => setGuardian(e.target.value)} />
        </Field>
      )}
      <Field label="Contact number">
        <input style={styles.input} value={contact} onChange={(e) => setContact(e.target.value)} />
      </Field>
      <Field label="Address">
        <input style={styles.input} value={address} onChange={(e) => setAddress(e.target.value)} />
      </Field>
      <Field label="Known allergies">
        <input style={styles.input} value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="None known, or list allergen(s)" />
      </Field>
      <button
        style={{ ...styles.primaryBtn, justifyContent: "center", marginTop: 6 }}
        onClick={() => name.trim() && onSubmit({ name: name.trim(), dob, sex, contact, address, guardian, allergies })}
      >
        <Check size={15} /> {submitLabel}
      </button>
    </div>
  );
}

/* ---------------- Patient detail ---------------- */
const PATIENT_EDITABLE_FIELDS = [
  { key: "name", label: "Name" },
  { key: "dob", label: "Date of birth" },
  { key: "sex", label: "Sex" },
  { key: "contact", label: "Contact number" },
  { key: "address", label: "Address" },
  { key: "guardian", label: "Guardian" },
  { key: "allergies", label: "Allergies" },
];

function PatientDetail({ patient, data, persist, currentUser, showToast, clinicInfo, commonMeds, rxTemplates, labTemplates, persistLabTemplates, onBack }) {
  const [tab, setTab] = useState("chart");
  const [formsJumpTo, setFormsJumpTo] = useState(null); // lets "Order Labs" (in Treatment Plans) open Forms straight to the lab request
  const [showEditPatient, setShowEditPatient] = useState(false);
  const age = calcAge(patient.dob);
  const isPeds = age !== null && age < 18;

  const plans = data.treatmentPlans.filter((t) => t.patientId === patient.id).sort((a, b) => b.date.localeCompare(a.date));
  const rx = data.prescriptions.filter((r) => r.patientId === patient.id).sort((a, b) => b.date.localeCompare(a.date));
  const certs = (data.certificates || []).filter((c) => c.patientId === patient.id).sort((a, b) => b.date.localeCompare(a.date));
  const exams = (data.physicalExams || []).filter((e) => e.patientId === patient.id).sort((a, b) => b.date.localeCompare(a.date));
  const labRequests = (data.labRequests || []).filter((l) => l.patientId === patient.id).sort((a, b) => b.date.localeCompare(a.date));
  const auditLog = (data.auditLog || []).filter((a) => a.patientId === patient.id).sort((a, b) => b.date.localeCompare(a.date));
  const history = patient.history || [];

  function goOrderLabs() {
    setFormsJumpTo("labs");
    setTab("forms");
  }

  // Every add-action writes its normal record AND a matching audit entry, in the same save.
  function withAudit(dataNext, action, summary) {
    const entry = { id: uid("audit"), patientId: patient.id, date: new Date().toISOString(), provider: currentUser.name, action, summary };
    return { ...dataNext, auditLog: [...(data.auditLog || []), entry] };
  }

  async function addNote(note) {
    const patients = data.patients.map((p) =>
      p.id === patient.id
        ? { ...p, history: [{ ...note, id: uid("note"), date: new Date().toISOString(), provider: currentUser.name }, ...(p.history || [])] }
        : p
    );
    await persist(withAudit({ ...data, patients }, "chart_note_added", "Added a chart note"));
    showToast("Chart note added");
  }

  async function addPlan(plan) {
    const treatmentPlans = [...data.treatmentPlans, { ...plan, id: uid("plan"), patientId: patient.id, date: new Date().toISOString(), provider: currentUser.name }];
    await persist(withAudit({ ...data, treatmentPlans }, "treatment_plan_added", plan.diagnosis ? `Treatment plan: ${plan.diagnosis}` : "Added a treatment plan"));
    showToast("Treatment plan saved");
  }

  async function addRx(rxData) {
    const prescriptions = [...data.prescriptions, { ...rxData, id: uid("rx"), patientId: patient.id, date: new Date().toISOString(), provider: currentUser.name }];
    await persist(withAudit({ ...data, prescriptions }, "prescription_created", `Prescription (${rxData.meds.length} medication${rxData.meds.length === 1 ? "" : "s"})`));
    showToast("Prescription created");
  }

  async function addCertificate(certData) {
    const certificates = [...(data.certificates || []), { ...certData, id: uid("cert"), patientId: patient.id, date: new Date().toISOString(), provider: currentUser.name }];
    await persist(withAudit({ ...data, certificates }, "certificate_created", "Issued a medical certificate"));
    showToast("Medical certificate created");
  }

  async function addExam(examData) {
    const physicalExams = [...(data.physicalExams || []), { ...examData, id: uid("exam"), patientId: patient.id, date: new Date().toISOString(), provider: currentUser.name }];
    await persist(withAudit({ ...data, physicalExams }, "physical_exam_saved", "Saved a physical exam report"));
    showToast("Physical exam report saved");
  }

  async function addLabRequest(labData) {
    const labRequests = [...(data.labRequests || []), { ...labData, id: uid("lab"), patientId: patient.id, date: new Date().toISOString(), provider: currentUser.name }];
    const count = labData.tests.length + labData.details.length;
    await persist(withAudit({ ...data, labRequests }, "lab_request_created", `Lab/diagnostic request (${count} item${count === 1 ? "" : "s"})`));
    showToast("Lab & diagnostic request saved");
  }

  async function updatePatientInfo(updated) {
    const changed = PATIENT_EDITABLE_FIELDS
      .map(({ key, label }) => ({ key, label, from: patient[key] || "", to: updated[key] || "" }))
      .filter((c) => c.from !== c.to);
    if (changed.length === 0) {
      setShowEditPatient(false);
      return;
    }
    const patients = data.patients.map((p) => (p.id === patient.id ? { ...p, ...updated } : p));
    const summary = `Updated ${changed.map((c) => c.label).join(", ")}`;
    await persist(withAudit({ ...data, patients }, "patient_updated", summary));
    showToast("Patient info updated");
    setShowEditPatient(false);
  }

  return (
    <div>
      <button onClick={onBack} style={styles.backBtn}>
        <ChevronLeft size={16} /> All patients
      </button>

      <div style={styles.patientHeader}>
        <div style={{ ...styles.avatarDot, width: 44, height: 44, background: isPeds ? "#C97A2B" : "#0F5E56" }}>
          {isPeds ? <Baby size={20} color="#fff" /> : <UserRound size={20} color="#fff" />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, color: "#12312D" }}>{patient.name}</div>
          <div style={{ fontSize: 12.5, color: "#5B6B68" }}>
            {age !== null ? `${age} yrs` : "Age unknown"} · {patient.sex} · MRN <span style={styles.mono}>{patient.id}</span>
            {patient.guardian ? ` · Guardian: ${patient.guardian}` : ""}
          </div>
        </div>
        {patient.allergies && (
          <span style={styles.allergyTag}>
            <AlertTriangle size={13} /> {patient.allergies}
          </span>
        )}
        <button style={styles.linkBtn} onClick={() => setShowEditPatient(true)}><Pencil size={13} /> Edit</button>
      </div>

      {showEditPatient && (
        <Modal title="Edit patient info" onClose={() => setShowEditPatient(false)}>
          <PatientForm initial={patient} onSubmit={updatePatientInfo} submitLabel="Save changes" />
        </Modal>
      )}

      <div style={styles.tabRow}>
        {[
          { key: "chart", label: "Chart", icon: FileText },
          { key: "plans", label: "Treatment plans", icon: Stethoscope },
          { key: "rx", label: "Prescriptions", icon: Pill },
          { key: "forms", label: "Forms", icon: ClipboardList },
          { key: "activity", label: "Activity log", icon: Clock },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)} style={{ ...styles.tabBtn, ...(tab === key ? styles.tabBtnActive : {}) }}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {tab === "chart" && <ChartTab history={history} onAddNote={addNote} />}
      {tab === "plans" && <PlansTab plans={plans} onAddPlan={addPlan} onOrderLabs={goOrderLabs} />}
      {tab === "rx" && <RxTab rx={rx} onAddRx={addRx} isPeds={isPeds} patient={patient} clinicInfo={clinicInfo} provider={currentUser.name} commonMeds={commonMeds} rxTemplates={rxTemplates} history={history} />}
      {tab === "forms" && (
        <FormsTab
          certs={certs}
          exams={exams}
          labRequests={labRequests}
          onAddCertificate={addCertificate}
          onAddExam={addExam}
          patient={patient}
          clinicInfo={clinicInfo}
          provider={currentUser.name}
          onAddLabRequest={addLabRequest}
          labTemplates={labTemplates}
          persistLabTemplates={persistLabTemplates}
          showToast={showToast}
          jumpTo={formsJumpTo}
          onJumped={() => setFormsJumpTo(null)}
        />
      )}
      {tab === "activity" && <ActivityLogTab auditLog={auditLog} />}
    </div>
  );
}

function ActivityLogTab({ auditLog }) {
  return (
    <div>
      <div style={{ fontSize: 12.5, color: "#5B6B68", margin: "0 0 14px" }}>
        A running record of who did what on this chart, and when — added automatically, can't be edited or deleted.
      </div>
      <SectionCard title={`Activity (${auditLog.length})`}>
        {auditLog.length === 0 ? (
          <EmptyState text="No activity recorded yet." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {auditLog.map((a) => (
              <div key={a.id} style={styles.entryCard}>
                <div style={styles.entryDate}>{fmtDateTime(a.date)} · {a.provider}</div>
                <div style={{ fontSize: 13.5, color: "#12312D", marginTop: 4 }}>{a.summary}</div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function ChartTab({ history, onAddNote }) {
  const [showForm, setShowForm] = useState(false);
  const [note, setNote] = useState("");
  const [weight, setWeight] = useState("");
  const [bp, setBp] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [temp, setTemp] = useState("");

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
        <button style={styles.primaryBtn} onClick={() => setShowForm((s) => !s)}>
          <Plus size={15} /> Add chart note
        </button>
      </div>
      {showForm && (
        <div style={styles.card}>
          <div style={{ fontSize: 11.5, color: "#5B6B68", marginBottom: 4 }}>Vitals (optional)</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <Field label="Weight" style={{ flex: 1, minWidth: 110 }}>
              <input style={styles.input} value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 62 kg" />
            </Field>
            <Field label="Blood Pressure" style={{ flex: 1, minWidth: 110 }}>
              <input style={styles.input} value={bp} onChange={(e) => setBp(e.target.value)} placeholder="e.g. 120/80" />
            </Field>
            <Field label="Heart Rate" style={{ flex: 1, minWidth: 110 }}>
              <input style={styles.input} value={heartRate} onChange={(e) => setHeartRate(e.target.value)} placeholder="e.g. 78 bpm" />
            </Field>
            <Field label="Temperature" style={{ flex: 1, minWidth: 110 }}>
              <input style={styles.input} value={temp} onChange={(e) => setTemp(e.target.value)} placeholder="e.g. 36.8°C" />
            </Field>
          </div>
          <Field label="Note">
            <textarea style={{ ...styles.input, minHeight: 80, fontFamily: "inherit" }} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <button
            style={{ ...styles.primaryBtn, justifyContent: "center", marginTop: 10 }}
            onClick={() => {
              if (!note.trim()) return;
              onAddNote({
                note: note.trim(),
                weight: weight.trim(),
                bp: bp.trim(),
                heartRate: heartRate.trim(),
                temp: temp.trim(),
              });
              setNote(""); setWeight(""); setBp(""); setHeartRate(""); setTemp(""); setShowForm(false);
            }}
          >
            <Check size={15} /> Save note
          </button>
        </div>
      )}
      <SectionCard title="Chart history">
        {history.length === 0 ? (
          <EmptyState text="No chart notes yet." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {history.map((h) => {
              const vitalsLine = [
                h.weight ? `Wt ${h.weight}` : "",
                h.bp ? `BP ${h.bp}` : "",
                h.heartRate ? `HR ${h.heartRate}` : "",
                h.temp ? `Temp ${h.temp}` : "",
              ].filter(Boolean).join(" · ") || h.vitals; // h.vitals covers notes saved before this field split
              return (
                <div key={h.id} style={styles.entryCard}>
                  <div style={styles.entryDate}>{fmtDateTime(h.date)}{h.provider ? ` · ${h.provider}` : ""}</div>
                  {vitalsLine && <div style={{ ...styles.mono, fontSize: 12, color: "#0F5E56", marginBottom: 4 }}>{vitalsLine}</div>}
                  <div style={{ fontSize: 13.5, color: "#2A3B38" }}>{h.note}</div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function PlansTab({ plans, onAddPlan, onOrderLabs }) {
  const [showForm, setShowForm] = useState(false);
  const [diagnosis, setDiagnosis] = useState("");
  const [plan, setPlan] = useState("");
  const [followUp, setFollowUp] = useState("");

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 10 }}>
        <button style={{ ...styles.primaryBtn, background: "#fff", color: "#0F5E56", border: "1px solid #0F5E56" }} onClick={onOrderLabs}>
          <ClipboardList size={15} /> Order labs &amp; diagnostics
        </button>
        <button style={styles.primaryBtn} onClick={() => setShowForm((s) => !s)}>
          <Plus size={15} /> New treatment plan
        </button>
      </div>
      {showForm && (
        <div style={styles.card}>
          <Field label="Diagnosis / assessment">
            <input style={styles.input} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
          </Field>
          <Field label="Plan">
            <textarea style={{ ...styles.input, minHeight: 90, fontFamily: "inherit" }} value={plan} onChange={(e) => setPlan(e.target.value)} placeholder="Interventions, goals, patient education, referrals…" />
          </Field>
          <Field label="Follow-up">
            <input style={styles.input} value={followUp} onChange={(e) => setFollowUp(e.target.value)} placeholder="e.g. Recheck in 2 weeks" />
          </Field>
          <button
            style={{ ...styles.primaryBtn, justifyContent: "center" }}
            onClick={() => {
              if (!plan.trim()) return;
              onAddPlan({ diagnosis: diagnosis.trim(), plan: plan.trim(), followUp: followUp.trim() });
              setDiagnosis(""); setPlan(""); setFollowUp(""); setShowForm(false);
            }}
          >
            <Check size={15} /> Save plan
          </button>
        </div>
      )}
      <SectionCard title="Treatment plan history">
        {plans.length === 0 ? (
          <EmptyState text="No treatment plans yet." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {plans.map((p) => (
              <div key={p.id} style={styles.entryCard}>
                <div style={styles.entryDate}>{fmtDateTime(p.date)} · {p.provider}</div>
                {p.diagnosis && <div style={{ fontWeight: 600, fontSize: 13.5, color: "#12312D", marginBottom: 3 }}>{p.diagnosis}</div>}
                <div style={{ fontSize: 13.5, color: "#2A3B38", whiteSpace: "pre-wrap" }}>{p.plan}</div>
                {p.followUp && <div style={{ fontSize: 12, color: "#5B6B68", marginTop: 4 }}>Follow-up: {p.followUp}</div>}
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function RxTab({ rx, onAddRx, isPeds, patient, clinicInfo, provider, commonMeds, rxTemplates, history }) {
  const [showForm, setShowForm] = useState(false);
  const [meds, setMeds] = useState([{ name: "", qty: "", am: "", nn: "", pm: "", remarks: "" }]);
  const [notes, setNotes] = useState("");
  const [openSuggestRow, setOpenSuggestRow] = useState(null);
  const [printRx, setPrintRx] = useState(null);

  const medList = commonMeds;
  const templateList = rxTemplates;

  function applyTemplate(tpl) {
    setMeds(tpl.meds.map((m) => ({ ...m })));
  }

  function updateMed(i, field, val) {
    setMeds((m) => m.map((row, idx) => (idx === i ? { ...row, [field]: val } : row)));
  }
  function addMedRow() {
    setMeds((m) => [...m, { name: "", qty: "", am: "", nn: "", pm: "", remarks: "" }]);
  }
  function removeMedRow(i) {
    setMeds((m) => m.filter((_, idx) => idx !== i));
  }
  function pickSuggestion(i, med) {
    const slots = deriveDoseSlots(med.frequency, med.dosage);
    const remarks = buildRemarks(med.duration, med.notes);
    setMeds((m) => m.map((row, idx) => (idx === i ? { ...row, name: med.name, am: slots.am, nn: slots.nn, pm: slots.pm, remarks } : row)));
    setOpenSuggestRow(null);
  }

  function handlePrint(r) {
    setPrintRx(r);
    setTimeout(() => {
      window.print();
    }, 60);
  }

  useEffect(() => {
    function afterPrint() { setPrintRx(null); }
    window.addEventListener("afterprint", afterPrint);
    return () => window.removeEventListener("afterprint", afterPrint);
  }, []);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
        <button style={styles.primaryBtn} onClick={() => setShowForm((s) => !s)}>
          <Plus size={15} /> New prescription
        </button>
      </div>
      {showForm && (
        <div style={styles.card}>
          {templateList.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "#12312D", marginBottom: 6 }}>
                Use a diagnosis template
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {templateList.map((tpl) => (
                  <button key={tpl.id} type="button" style={styles.pillToggle} onClick={() => applyTemplate(tpl)}>
                    {tpl.label} ({tpl.meds.length})
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 11, color: "#8A9793", marginTop: 6 }}>
                Fills in every medication from the template at once — delete any rows that don't apply
                (e.g. pick one antibiotic out of several options) before saving.
              </div>
            </div>
          )}
          <div style={{ fontSize: 11.5, color: "#5B6B68", marginBottom: 10 }}>
            Showing your clinic's medications as you type — start typing a medication
            name (3+ letters) and pick a match to auto-fill quantity slots and remarks. You can still edit
            anything after picking, or skip suggestions and type your own.
          </div>
          <div style={{ display: "flex", gap: 8, fontSize: 11, color: "#8A9793", padding: "0 0 4px", fontWeight: 600 }}>
            <div style={{ flex: 2 }}></div>
            <div style={{ width: 56, textAlign: "center" }}>No.</div>
            <div style={{ width: 50, textAlign: "center" }}>AM</div>
            <div style={{ width: 50, textAlign: "center" }}>NN</div>
            <div style={{ width: 50, textAlign: "center" }}>PM</div>
            <div style={{ flex: 1.4 }}></div>
          </div>
          {meds.map((row, i) => {
            const q = row.name.trim().toLowerCase();
            const suggestions =
              q.length >= 3
                ? medList.filter((m) => m.name.toLowerCase().includes(q)).slice(0, 6)
                : [];
            return (
              <div key={i} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                  <Field label="Medication" style={{ flex: 2, position: "relative" }}>
                    <input
                      style={styles.input}
                      value={row.name}
                      onChange={(e) => {
                        updateMed(i, "name", e.target.value);
                        setOpenSuggestRow(i);
                      }}
                      onFocus={() => setOpenSuggestRow(i)}
                      onBlur={() => setTimeout(() => setOpenSuggestRow((r) => (r === i ? null : r)), 120)}
                      placeholder="Start typing e.g. Cef, Para, Salbu…"
                      autoComplete="off"
                    />
                    {openSuggestRow === i && suggestions.length > 0 && (
                      <div style={styles.suggestBox}>
                        {suggestions.map((m) => (
                          <div
                            key={m.name}
                            style={styles.suggestItem}
                            onMouseDown={() => pickSuggestion(i, m)}
                          >
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</div>
                            <div style={{ fontSize: 11.5, color: "#5B6B68" }}>
                              {m.dosage} · {m.frequency} · {m.duration}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Field>
                  <input style={{ ...styles.input, width: 56, textAlign: "center" }} value={row.qty} onChange={(e) => updateMed(i, "qty", e.target.value)} placeholder="No." />
                  <input style={{ ...styles.input, width: 50, textAlign: "center" }} value={row.am} onChange={(e) => updateMed(i, "am", e.target.value)} placeholder="0" />
                  <input style={{ ...styles.input, width: 50, textAlign: "center" }} value={row.nn} onChange={(e) => updateMed(i, "nn", e.target.value)} placeholder="0" />
                  <input style={{ ...styles.input, width: 50, textAlign: "center" }} value={row.pm} onChange={(e) => updateMed(i, "pm", e.target.value)} placeholder="0" />
                  <input style={{ ...styles.input, flex: 1.4 }} value={row.remarks} onChange={(e) => updateMed(i, "remarks", e.target.value)} placeholder="e.g. for 7 days after meals" />
                  {meds.length > 1 && (
                    <button style={styles.iconBtn} onClick={() => removeMedRow(i)} aria-label="Remove"><Trash2 size={14} /></button>
                  )}
                </div>
              </div>
            );
          })}
          <button style={styles.linkBtn} onClick={addMedRow}><Plus size={13} /> Add another medication</button>
          <Field label="Notes for patient/pharmacy">
            <textarea style={{ ...styles.input, minHeight: 60, fontFamily: "inherit" }} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          <button
            style={{ ...styles.primaryBtn, justifyContent: "center", marginTop: 6 }}
            onClick={() => {
              const validMeds = meds.filter((m) => m.name.trim());
              if (validMeds.length === 0) return;
              onAddRx({ meds: validMeds, notes: notes.trim() });
              setMeds([{ name: "", qty: "", am: "", nn: "", pm: "", remarks: "" }]); setNotes(""); setShowForm(false);
            }}
          >
            <Check size={15} /> Save prescription
          </button>
        </div>
      )}
      <SectionCard title="Prescription history">
        {rx.length === 0 ? (
          <EmptyState text="No prescriptions yet." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {rx.map((r) => (
              <div key={r.id} style={styles.entryCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={styles.entryDate}>{fmtDateTime(r.date)} · {r.provider}</div>
                  <button style={styles.linkBtn} onClick={() => handlePrint(r)}>
                    <FileText size={13} /> Print
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
                  {r.meds.map((m, idx) => (
                    <div key={idx} style={{ ...styles.mono, fontSize: 12.5, color: "#12312D" }}>
                      {m.qty ? `[${m.qty}] ` : ""}{m.name} — AM {m.am || "0"} · NN {m.nn || "0"} · PM {m.pm || "0"}{m.remarks ? ` — ${m.remarks}` : ""}
                    </div>
                  ))}
                </div>
                {r.notes && <div style={{ fontSize: 12.5, color: "#5B6B68", marginTop: 6 }}>{r.notes}</div>}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <div id="rx-print-area">
        {printRx && <PrintableRx rx={printRx} patient={patient} clinicInfo={clinicInfo} provider={printRx.provider || provider} vitals={getLatestVitals(history)} />}
      </div>
    </div>
  );
}

/* ---------------- Printable Rx (matches clinic paper pad) ---------------- */
function PrintableRx({ rx, patient, clinicInfo, provider, vitals }) {
  const age = calcAge(patient.dob);
  const today = new Date(rx.date || Date.now());
  const v = vitals || {};
  return (
    <div style={printStyles.page}>
      <div style={printStyles.headerRow}>
        <div style={printStyles.logoCircle}>
          <Stethoscope size={26} color="#0F5E56" />
        </div>
        <div>
          <div style={printStyles.clinicName}>{clinicInfo.name}</div>
          <div style={printStyles.clinicSub}>{clinicInfo.address}</div>
          <div style={printStyles.clinicSub}>{clinicInfo.phone}</div>
        </div>
      </div>

      <div style={printStyles.fieldsRow}>
        <div style={printStyles.fieldsCol}>
          <div style={printStyles.fieldLine}><b>Name:</b> {patient.name}</div>
          <div style={printStyles.fieldLine}><b>Address:</b> {patient.address || ""}</div>
          <div style={printStyles.fieldLine}><b>Contact No:</b> {patient.contact || ""}</div>
        </div>
        <div style={printStyles.fieldsCol}>
          <div style={printStyles.fieldLine}><b>Date:</b> {fmtDate(today)}</div>
          <div style={printStyles.fieldLine}><b>Age/Sex:</b> {age !== null ? age : "—"} / {(patient.sex || "").slice(0, 1)}</div>
          <div style={printStyles.fieldLine}>
            <b>BP:</b> {v.bp || "_________"} &nbsp; <b>Temp:</b> {v.temp || "_____"} &nbsp; <b>Weight:</b> {v.weight || "_____"}
          </div>
        </div>
      </div>

      <div style={printStyles.rxMark}>R<span style={{ fontSize: "0.6em" }}>x</span></div>

      <table style={printStyles.table}>
        <thead>
          <tr>
            <th style={{ ...printStyles.th, width: 34 }}>No</th>
            <th style={printStyles.th}>Medications and Dosage</th>
            <th style={{ ...printStyles.th, width: 34 }}>AM</th>
            <th style={{ ...printStyles.th, width: 34 }}>NN</th>
            <th style={{ ...printStyles.th, width: 34 }}>PM</th>
            <th style={{ ...printStyles.th, width: 150 }}>Remarks</th>
          </tr>
        </thead>
        <tbody>
          {rx.meds.map((m, i) => (
            <tr key={i}>
              <td style={printStyles.tdCenter}>{m.qty || ""}</td>
              <td style={printStyles.td}>{m.name}</td>
              <td style={printStyles.tdCenter}>{m.am || ""}</td>
              <td style={printStyles.tdCenter}>{m.nn || ""}</td>
              <td style={printStyles.tdCenter}>{m.pm || ""}</td>
              <td style={printStyles.td}>{m.remarks || ""}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {rx.notes && (
        <div style={{ fontSize: 12, marginTop: 10 }}>
          <b>Notes:</b> {rx.notes}
        </div>
      )}

      <div style={printStyles.footerRow}>
        <div style={printStyles.followUp}>Follow-up: _________________, {today.getFullYear()}</div>
        <div style={printStyles.signatureBlock}>
          <div style={printStyles.signatureLine}>{provider}</div>
          <div style={{ fontSize: 11 }}>Medical Doctor</div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Forms (Medical Certificate, etc.) ---------------- */
function FormsTab({ certs, exams, labRequests, onAddCertificate, onAddExam, onAddLabRequest, patient, clinicInfo, provider, jumpTo, onJumped, labTemplates, persistLabTemplates, showToast }) {
  const [formType, setFormType] = useState("cert");
  const [autoOpenLabs, setAutoOpenLabs] = useState(false);

  useEffect(() => {
    if (jumpTo === "labs") {
      setFormType("labs");
      setAutoOpenLabs(true);
      onJumped && onJumped();
    }
  }, [jumpTo]);

  return (
    <div>
      <div style={styles.subNavRow}>
        <button
          style={{ ...styles.subNavBtn, ...(formType === "cert" ? styles.subNavBtnActive : {}) }}
          onClick={() => setFormType("cert")}
        >
          Medical Certificate
        </button>
        <button
          style={{ ...styles.subNavBtn, ...(formType === "exam" ? styles.subNavBtnActive : {}) }}
          onClick={() => setFormType("exam")}
        >
          Physical Exam Report
        </button>
        <button
          style={{ ...styles.subNavBtn, ...(formType === "labs" ? styles.subNavBtnActive : {}) }}
          onClick={() => setFormType("labs")}
        >
          Lab &amp; Diagnostic Request
        </button>
      </div>
      {formType === "cert" && (
        <MedCertSection certs={certs} onAddCertificate={onAddCertificate} patient={patient} clinicInfo={clinicInfo} provider={provider} />
      )}
      {formType === "exam" && (
        <PhysicalExamSection exams={exams} onAddExam={onAddExam} patient={patient} clinicInfo={clinicInfo} provider={provider} />
      )}
      {formType === "labs" && (
        <LabRequestSection
          labRequests={labRequests}
          onAddLabRequest={onAddLabRequest}
          patient={patient}
          clinicInfo={clinicInfo}
          provider={provider}
          autoOpen={autoOpenLabs}
          onAutoOpened={() => setAutoOpenLabs(false)}
          labTemplates={labTemplates}
          persistLabTemplates={persistLabTemplates}
          showToast={showToast}
        />
      )}
    </div>
  );
}

function MedCertSection({ certs, onAddCertificate, patient, clinicInfo, provider }) {
  const [showForm, setShowForm] = useState(false);
  const [examDate, setExamDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState("");
  const [assessment, setAssessment] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [printCert, setPrintCert] = useState(null);

  function handlePrint(c) {
    setPrintCert(c);
    setTimeout(() => window.print(), 60);
  }

  useEffect(() => {
    function afterPrint() { setPrintCert(null); }
    window.addEventListener("afterprint", afterPrint);
    return () => window.removeEventListener("afterprint", afterPrint);
  }, []);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
        <button style={styles.primaryBtn} onClick={() => setShowForm((s) => !s)}>
          <Plus size={15} /> New medical certificate
        </button>
      </div>

      {showForm && (
        <div style={styles.card}>
          <div style={{ fontSize: 11.5, color: "#5B6B68", marginBottom: 10 }}>
            Name, age, sex, and address are pulled from {patient.name}'s patient record automatically —
            just fill in the exam details below.
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Field label="Examined on" style={{ flex: 1 }}>
              <input type="date" style={styles.input} value={examDate} onChange={(e) => setExamDate(e.target.value)} />
            </Field>
            <Field label="For (reason / diagnosis)" style={{ flex: 2 }}>
              <input style={styles.input} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. upper respiratory tract infection" />
            </Field>
          </div>
          <Field label="Assessment / Impression">
            <textarea style={{ ...styles.input, minHeight: 80, fontFamily: "inherit" }} value={assessment} onChange={(e) => setAssessment(e.target.value)} />
          </Field>
          <Field label="Recommendation/s">
            <textarea style={{ ...styles.input, minHeight: 80, fontFamily: "inherit" }} value={recommendation} onChange={(e) => setRecommendation(e.target.value)} />
          </Field>
          <button
            style={{ ...styles.primaryBtn, justifyContent: "center", marginTop: 6 }}
            onClick={() => {
              if (!reason.trim() && !assessment.trim()) return;
              onAddCertificate({ examDate, reason: reason.trim(), assessment: assessment.trim(), recommendation: recommendation.trim() });
              setReason(""); setAssessment(""); setRecommendation(""); setShowForm(false);
            }}
          >
            <Check size={15} /> Save certificate
          </button>
        </div>
      )}

      <SectionCard title="Medical certificates issued">
        {certs.length === 0 ? (
          <EmptyState text="No medical certificates issued yet." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {certs.map((c) => (
              <div key={c.id} style={styles.entryCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={styles.entryDate}>{fmtDateTime(c.date)} · {c.provider}</div>
                  <button style={styles.linkBtn} onClick={() => handlePrint(c)}>
                    <FileText size={13} /> Print
                  </button>
                </div>
                <div style={{ fontSize: 13.5, color: "#12312D", marginTop: 4 }}>
                  Examined {fmtDate(c.examDate)}{c.reason ? ` for ${c.reason}` : ""}
                </div>
                {c.assessment && <div style={{ fontSize: 12.5, color: "#5B6B68", marginTop: 4 }}>{c.assessment}</div>}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <div id="cert-print-area">
        {printCert && <PrintableMedCert cert={printCert} patient={patient} clinicInfo={clinicInfo} provider={printCert.provider || provider} />}
      </div>
    </div>
  );
}

function Blank({ children, minWidth = 90 }) {
  return (
    <span style={{ ...printStyles.blank, minWidth }}>
      {children}
    </span>
  );
}

function YesNo({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {["NO", "YES"].map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          style={{ ...styles.pillToggle, ...(value === v ? styles.pillToggleActive : {}) }}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

function CheckGroup({ items, checked, onToggle, columns = 2 }) {
  return (
    <div style={{ columns, WebkitColumns: columns, columnGap: 22 }}>
      {items.map((label) => (
        <label key={label} style={styles.checkItem}>
          <input type="checkbox" checked={!!checked[label]} onChange={() => onToggle(label)} style={{ marginTop: 2, flexShrink: 0 }} />
          <span>{label}</span>
        </label>
      ))}
    </div>
  );
}

/* ---------------- Physical Exam Report section ---------------- */
function PhysicalExamSection({ exams, onAddExam, patient, clinicInfo, provider }) {
  const [showForm, setShowForm] = useState(false);
  const [printExam, setPrintExam] = useState(null);

  const [classification, setClassification] = useState("Pre-Employment");
  const [classificationOther, setClassificationOther] = useState("");

  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [occupation, setOccupation] = useState("");
  const [company, setCompany] = useState("");
  const [mobile, setMobile] = useState(patient.contact || "");
  const [gender, setGender] = useState(patient.sex === "Male" ? "Male" : patient.sex === "Female" ? "Female" : "");
  const [birthDate, setBirthDate] = useState(patient.dob || "");
  const [civilStatus, setCivilStatus] = useState("");
  const [address, setAddress] = useState(patient.address || "");

  const [symptomChecks, setSymptomChecks] = useState({});
  const [pastChecks, setPastChecks] = useState({});
  const [pastOthers, setPastOthers] = useState("");
  const [hospitalized, setHospitalized] = useState("NO");
  const [hospYear, setHospYear] = useState("");
  const [hospReason, setHospReason] = useState("");

  const [familyChecks, setFamilyChecks] = useState({});
  const [familyCancer, setFamilyCancer] = useState(false);
  const [familyCancerType, setFamilyCancerType] = useState("");
  const [familyOthers, setFamilyOthers] = useState("");

  const [smoke, setSmoke] = useState("NO");
  const [smokeAmount, setSmokeAmount] = useState("");
  const [smokeStoppedSince, setSmokeStoppedSince] = useState("");
  const [alcohol, setAlcohol] = useState("NO");
  const [alcoholFrequency, setAlcoholFrequency] = useState("Daily");
  const [alcoholYears, setAlcoholYears] = useState("");
  const [alcoholKind, setAlcoholKind] = useState("");

  const [lmp, setLmp] = useState("");
  const [pregnant, setPregnant] = useState("NO");
  const [pregnancyProblems, setPregnancyProblems] = useState("");

  const [presentMed, setPresentMed] = useState("NO");
  const [presentMedSpecify, setPresentMedSpecify] = useState("");
  const [foodDrugAllergy, setFoodDrugAllergy] = useState(patient.allergies || "");

  function toggle(setFn) {
    return (label) => setFn((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  function handlePrint(e) {
    setPrintExam(e);
    setTimeout(() => window.print(), 60);
  }

  useEffect(() => {
    function afterPrint() { setPrintExam(null); }
    window.addEventListener("afterprint", afterPrint);
    return () => window.removeEventListener("afterprint", afterPrint);
  }, []);

  function resetAndSave() {
    const examData = {
      classification, classificationOther,
      lastName: lastName.trim(), firstName: firstName.trim(), middleName: middleName.trim(),
      occupation: occupation.trim(), company: company.trim(), mobile: mobile.trim(),
      gender, birthDate, civilStatus, address: address.trim(),
      symptomChecks, pastChecks, pastOthers: pastOthers.trim(),
      hospitalized, hospYear: hospYear.trim(), hospReason: hospReason.trim(),
      familyChecks, familyCancer, familyCancerType: familyCancerType.trim(), familyOthers: familyOthers.trim(),
      smoke, smokeAmount: smokeAmount.trim(), smokeStoppedSince: smokeStoppedSince.trim(),
      alcohol, alcoholFrequency, alcoholYears: alcoholYears.trim(), alcoholKind: alcoholKind.trim(),
      lmp, pregnant, pregnancyProblems: pregnancyProblems.trim(),
      presentMed, presentMedSpecify: presentMedSpecify.trim(), foodDrugAllergy: foodDrugAllergy.trim(),
    };
    onAddExam(examData);
    setShowForm(false);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
        <button style={styles.primaryBtn} onClick={() => setShowForm((s) => !s)}>
          <Plus size={15} /> New physical exam report
        </button>
      </div>

      {showForm && (
        <div style={styles.card}>
          <div style={{ fontSize: 11.5, color: "#5B6B68", marginBottom: 14 }}>
            Gender, birth date, mobile, address, and allergies are pre-filled from {patient.name}'s record —
            check everything below before printing.
          </div>

          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#12312D", marginBottom: 6 }}>Classification</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            {["Pre-Employment", "Annual", "School", "Others"].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setClassification(c)}
                style={{ ...styles.pillToggle, ...(classification === c ? styles.pillToggleActive : {}) }}
              >
                {c}
              </button>
            ))}
            {classification === "Others" && (
              <input style={{ ...styles.input, width: 180 }} value={classificationOther} onChange={(e) => setClassificationOther(e.target.value)} placeholder="Specify" />
            )}
          </div>

          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#12312D", marginBottom: 6 }}>General information</div>
          <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
            <Field label="Last name" style={{ flex: 1 }}><input style={styles.input} value={lastName} onChange={(e) => setLastName(e.target.value)} /></Field>
            <Field label="First name" style={{ flex: 1 }}><input style={styles.input} value={firstName} onChange={(e) => setFirstName(e.target.value)} /></Field>
            <Field label="Middle name" style={{ flex: 1 }}><input style={styles.input} value={middleName} onChange={(e) => setMiddleName(e.target.value)} /></Field>
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
            <Field label="Occupation" style={{ flex: 1 }}><input style={styles.input} value={occupation} onChange={(e) => setOccupation(e.target.value)} /></Field>
            <Field label="Company" style={{ flex: 1 }}><input style={styles.input} value={company} onChange={(e) => setCompany(e.target.value)} /></Field>
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
            <Field label="Mobile no." style={{ flex: 1 }}><input style={styles.input} value={mobile} onChange={(e) => setMobile(e.target.value)} /></Field>
            <Field label="Gender" style={{ flex: 1 }}>
              <select style={styles.input} value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="">—</option>
                <option>Male</option>
                <option>Female</option>
              </select>
            </Field>
            <Field label="Birth date" style={{ flex: 1 }}><input type="date" style={styles.input} value={birthDate} onChange={(e) => setBirthDate(e.target.value)} /></Field>
            <Field label="Civil status" style={{ flex: 1 }}>
              <select style={styles.input} value={civilStatus} onChange={(e) => setCivilStatus(e.target.value)}>
                <option value="">—</option>
                <option>Single</option>
                <option>Married</option>
                <option>Widowed</option>
                <option>Separated</option>
              </select>
            </Field>
          </div>
          <Field label="Address"><input style={styles.input} value={address} onChange={(e) => setAddress(e.target.value)} /></Field>

          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#12312D", margin: "16px 0 6px" }}>
            Medical history — do you have or had in the past any of the following?
          </div>
          <CheckGroup items={SYMPTOM_CHECKLIST} checked={symptomChecks} onToggle={toggle(setSymptomChecks)} columns={3} />

          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#12312D", margin: "16px 0 6px" }}>
            Diagnosed conditions
          </div>
          <CheckGroup items={PAST_HISTORY_CHECKLIST} checked={pastChecks} onToggle={toggle(setPastChecks)} columns={3} />
          <div style={{ display: "flex", gap: 10, marginTop: 8, alignItems: "flex-end" }}>
            <Field label="Others" style={{ flex: 1 }}><input style={styles.input} value={pastOthers} onChange={(e) => setPastOthers(e.target.value)} /></Field>
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 12.5 }}>Have you been hospitalized before?</span>
            <YesNo value={hospitalized} onChange={setHospitalized} />
            {hospitalized === "YES" && (
              <>
                <input style={{ ...styles.input, width: 100 }} value={hospYear} onChange={(e) => setHospYear(e.target.value)} placeholder="Year" />
                <input style={{ ...styles.input, width: 200 }} value={hospReason} onChange={(e) => setHospReason(e.target.value)} placeholder="Reason" />
              </>
            )}
          </div>

          <div style={{ display: "flex", gap: 24, marginTop: 18, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "#12312D", marginBottom: 6 }}>
                Family history — any member suffering from:
              </div>
              <CheckGroup items={FAMILY_HISTORY_CHECKLIST} checked={familyChecks} onToggle={toggle(setFamilyChecks)} columns={1} />
              <label style={styles.checkItem}>
                <input type="checkbox" checked={familyCancer} onChange={() => setFamilyCancer((v) => !v)} style={{ marginTop: 2 }} />
                <span>Cancer (what type?)</span>
              </label>
              {familyCancer && (
                <input style={{ ...styles.input, marginBottom: 8 }} value={familyCancerType} onChange={(e) => setFamilyCancerType(e.target.value)} placeholder="Type" />
              )}
              <Field label="Others"><input style={styles.input} value={familyOthers} onChange={(e) => setFamilyOthers(e.target.value)} /></Field>
            </div>

            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "#12312D", marginBottom: 6 }}>Social history</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 12.5, width: 90 }}>Smoke?</span>
                <YesNo value={smoke} onChange={setSmoke} />
              </div>
              {smoke === "YES" && (
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <input style={styles.input} value={smokeAmount} onChange={(e) => setSmokeAmount(e.target.value)} placeholder="Sticks/packs per day" />
                  <input style={styles.input} value={smokeStoppedSince} onChange={(e) => setSmokeStoppedSince(e.target.value)} placeholder="Stopped since (if any)" />
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 12.5, width: 90 }}>Alcohol?</span>
                <YesNo value={alcohol} onChange={setAlcohol} />
              </div>
              {alcohol === "YES" && (
                <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                  <select style={{ ...styles.input, width: 110 }} value={alcoholFrequency} onChange={(e) => setAlcoholFrequency(e.target.value)}>
                    <option>Daily</option>
                    <option>Weekly</option>
                    <option>Once</option>
                  </select>
                  <input style={{ ...styles.input, width: 110 }} value={alcoholYears} onChange={(e) => setAlcoholYears(e.target.value)} placeholder="No. of years" />
                  <input style={{ ...styles.input, flex: 1 }} value={alcoholKind} onChange={(e) => setAlcoholKind(e.target.value)} placeholder="What kind" />
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 24, marginTop: 18, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "#12312D", marginBottom: 6 }}>OB-GYNE history</div>
              <Field label="Last menstrual period (1st day)"><input type="date" style={styles.input} value={lmp} onChange={(e) => setLmp(e.target.value)} /></Field>
              <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "8px 0" }}>
                <span style={{ fontSize: 12.5, width: 90 }}>Pregnant?</span>
                <YesNo value={pregnant} onChange={setPregnant} />
              </div>
              <Field label="Problems in previous pregnancy"><input style={styles.input} value={pregnancyProblems} onChange={(e) => setPregnancyProblems(e.target.value)} /></Field>
            </div>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "#12312D", marginBottom: 6 }}>Medication history</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 12.5 }}>Present medication/treatment?</span>
                <YesNo value={presentMed} onChange={setPresentMed} />
              </div>
              {presentMed === "YES" && (
                <Field label="Please specify"><input style={styles.input} value={presentMedSpecify} onChange={(e) => setPresentMedSpecify(e.target.value)} /></Field>
              )}
              <Field label="Food/drug allergy"><input style={styles.input} value={foodDrugAllergy} onChange={(e) => setFoodDrugAllergy(e.target.value)} /></Field>
            </div>
          </div>

          <button style={{ ...styles.primaryBtn, justifyContent: "center", marginTop: 18 }} onClick={resetAndSave}>
            <Check size={15} /> Save exam report
          </button>
        </div>
      )}

      <SectionCard title="Physical exam reports on file">
        {exams.length === 0 ? (
          <EmptyState text="No physical exam reports yet." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {exams.map((e) => (
              <div key={e.id} style={styles.entryCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={styles.entryDate}>{fmtDateTime(e.date)} · {e.provider}</div>
                  <button style={styles.linkBtn} onClick={() => handlePrint(e)}>
                    <FileText size={13} /> Print
                  </button>
                </div>
                <div style={{ fontSize: 13.5, color: "#12312D", marginTop: 4 }}>
                  {e.classification === "Others" ? e.classificationOther || "Others" : e.classification}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <div id="exam-print-area">
        {printExam && <PrintableExam exam={printExam} patient={patient} clinicInfo={clinicInfo} provider={printExam.provider || provider} />}
      </div>
    </div>
  );
}

function PrintChecklist({ items, checked }) {
  return (
    <div style={printStyles.checkGrid}>
      {items.map((label) => (
        <div key={label} style={printStyles.checkLine}>
          <span>{checked[label] ? "☑" : "☐"}</span> {label}
        </div>
      ))}
    </div>
  );
}

/* ---------------- Printable Physical Exam Report (matches clinic template) ---------------- */
function PrintableExam({ exam, patient, clinicInfo, provider }) {
  const issueDate = new Date(exam.date || Date.now());
  return (
    <div style={printStyles.page}>
      <div style={printStyles.examHeader}>
        <div style={printStyles.clinicName}>{clinicInfo.name}</div>
        <div style={printStyles.clinicSub}>{clinicInfo.address}</div>
        <div style={printStyles.clinicSub}>Mobile No. {clinicInfo.phone}</div>
      </div>

      <div style={printStyles.certTitle}>
        <span style={{ borderBottom: "2px solid #111", paddingBottom: 2 }}>MEDICAL EXAMINATION REPORT</span>
      </div>

      <div style={{ textAlign: "right", fontSize: 12.5, margin: "10px 0" }}>
        <b>Date:</b> <Blank minWidth={140}>{fmtDate(issueDate)}</Blank>
      </div>

      <div style={{ fontSize: 12.5, fontWeight: 700 }}>CLASSIFICATION:</div>
      <div style={{ fontSize: 12.5, margin: "4px 0 14px" }}>
        {["Pre-Employment", "Annual", "School"].map((c) => (
          <span key={c} style={{ marginRight: 18 }}>
            {exam.classification === c ? "☑" : "☐"} {c}
          </span>
        ))}
        <span>☐ Others: <Blank minWidth={140}>{exam.classification === "Others" ? exam.classificationOther : ""}</Blank></span>
      </div>

      <div style={{ fontSize: 12.5, fontWeight: 700, borderTop: "1px solid #333", paddingTop: 8 }}>GENERAL INFORMATION</div>
      <div style={{ display: "flex", gap: 20, marginTop: 10 }}>
        <div style={{ flex: 1 }}>
          <Blank minWidth={"100%"}>{exam.lastName}</Blank>
          <div style={printStyles.captionLabel}>Last Name</div>
        </div>
        <div style={{ flex: 1 }}>
          <Blank minWidth={"100%"}>{exam.firstName}</Blank>
          <div style={printStyles.captionLabel}>First Name</div>
        </div>
        <div style={{ flex: 1 }}>
          <Blank minWidth={"100%"}>{exam.middleName}</Blank>
          <div style={printStyles.captionLabel}>Middle Name</div>
        </div>
      </div>
      <div style={{ fontSize: 12.5, marginTop: 10 }}>
        Occupation: <Blank minWidth={220}>{exam.occupation}</Blank> &nbsp; Company: <Blank minWidth={220}>{exam.company}</Blank>
      </div>
      <div style={{ fontSize: 12.5, marginTop: 8 }}>
        Mobile No.: <Blank minWidth={140}>{exam.mobile}</Blank> &nbsp;
        Gender: {exam.gender === "Male" ? "☑" : "☐"} Male &nbsp; {exam.gender === "Female" ? "☑" : "☐"} Female &nbsp;
        Birth Date: <Blank minWidth={110}>{fmtDate(exam.birthDate)}</Blank> &nbsp;
        Civil Status: <Blank minWidth={100}>{exam.civilStatus}</Blank>
      </div>
      <div style={{ fontSize: 12.5, marginTop: 8 }}>
        Address: <Blank minWidth={"70%"}>{exam.address}</Blank>
      </div>

      <div style={{ fontSize: 12.5, fontWeight: 700, marginTop: 16 }}>MEDICAL HISTORY</div>
      <div style={{ fontSize: 12, marginBottom: 6 }}>Do you have or had in the past any of the following?</div>
      <PrintChecklist items={SYMPTOM_CHECKLIST} checked={exam.symptomChecks || {}} />

      <div style={{ fontSize: 12.5, fontWeight: 700, marginTop: 16 }}>MEDICAL HISTORY</div>
      <div style={{ display: "flex", gap: 20 }}>
        <div style={{ flex: 2 }}>
          <PrintChecklist items={PAST_HISTORY_CHECKLIST} checked={exam.pastChecks || {}} />
          <div style={printStyles.checkLine}>☐ Others: <Blank minWidth={140}>{exam.pastOthers}</Blank></div>
        </div>
        <div style={{ flex: 1, fontSize: 12 }}>
          <div>Have you been hospitalized before?</div>
          <div style={{ margin: "4px 0" }}>
            {exam.hospitalized === "NO" ? "☑" : "☐"} NO &nbsp; {exam.hospitalized === "YES" ? "☑" : "☐"} YES
          </div>
          <div>Year: <Blank minWidth={90}>{exam.hospYear}</Blank></div>
          <div style={{ marginTop: 4 }}>Reason: <Blank minWidth={90}>{exam.hospReason}</Blank></div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 20, marginTop: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700 }}>FAMILY HISTORY</div>
          <div style={{ fontSize: 12, marginBottom: 4 }}>Any member of the family suffering from the following;</div>
          <PrintChecklist items={FAMILY_HISTORY_CHECKLIST} checked={exam.familyChecks || {}} />
          <div style={printStyles.checkLine}>{exam.familyCancer ? "☑" : "☐"} Cancer (what type?) <Blank minWidth={130}>{exam.familyCancerType}</Blank></div>
          <div style={printStyles.checkLine}>☐ Others: <Blank minWidth={160}>{exam.familyOthers}</Blank></div>
        </div>
        <div style={{ flex: 1, fontSize: 12 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700 }}>SOCIAL HISTORY</div>
          <div style={{ marginTop: 4 }}>Do you smoke? {exam.smoke === "NO" ? "☑" : "☐"} NO &nbsp; {exam.smoke === "YES" ? "☑" : "☐"} YES</div>
          <div>Sticks/Packs per day: <Blank minWidth={80}>{exam.smokeAmount}</Blank></div>
          <div>Stopped since: <Blank minWidth={80}>{exam.smokeStoppedSince}</Blank></div>
          <div style={{ marginTop: 8 }}>
            Do you take alcohol drinks? {exam.alcohol === "NO" ? "☑" : "☐"} NO &nbsp; {exam.alcohol === "YES" ? "☑" : "☐"} YES
          </div>
          <div>{exam.alcohol === "YES" ? exam.alcoholFrequency : ""} &nbsp; No. of years: <Blank minWidth={60}>{exam.alcoholYears}</Blank></div>
          <div>What kind: <Blank minWidth={120}>{exam.alcoholKind}</Blank></div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 20, marginTop: 16 }}>
        <div style={{ flex: 1, fontSize: 12 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700 }}>OB-GYNE HISTORY</div>
          <div style={{ marginTop: 4 }}>Last Menstrual Period (1st day cycle): <Blank minWidth={110}>{fmtDate(exam.lmp)}</Blank></div>
          <div>Pregnant? {exam.pregnant === "NO" ? "☑" : "☐"} NO &nbsp; {exam.pregnant === "YES" ? "☑" : "☐"} YES</div>
          <div>Problems in previous pregnancy: <Blank minWidth={160}>{exam.pregnancyProblems}</Blank></div>
        </div>
        <div style={{ flex: 1, fontSize: 12 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700 }}>MEDICATION HISTORY</div>
          <div style={{ marginTop: 4 }}>
            Present Medication/Treatment: {exam.presentMed === "YES" ? "☑" : "☐"} YES Please specify: <Blank minWidth={140}>{exam.presentMedSpecify}</Blank>
          </div>
          <div style={{ marginTop: 4 }}>Food/Drug Allergy: <Blank minWidth={160}>{exam.foodDrugAllergy}</Blank></div>
        </div>
      </div>

      <p style={{ fontSize: 12, marginTop: 22, lineHeight: 1.7, textAlign: "justify" }}>
        "I hereby permit <b>{clinicInfo.name}</b> and the undersigned physician/s to furnish such information
        pertaining to my health status and other pertinent medical findings and by doing so, do hereby release
        them from legal responsibility. I hereby certify that my medical history contained above is true, and
        any false statement will disqualify me from employment."
      </p>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 30 }}>
        <div style={printStyles.signatureBlock}>
          <div style={printStyles.signatureLine}>{exam.lastName || exam.firstName ? `${exam.firstName} ${exam.middleName} ${exam.lastName}`.replace(/\s+/g, " ").trim() : patient.name}</div>
          <div style={{ fontSize: 11 }}>Signature over Printed Name</div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Printable Medical Certificate (matches clinic template) ---------------- */
function PrintableMedCert({ cert, patient, clinicInfo, provider }) {
  const age = calcAge(patient.dob);
  const issueDate = new Date(cert.date || Date.now());
  return (
    <div style={printStyles.page}>
      <div style={printStyles.headerRow}>
        <div style={printStyles.logoCircle}>
          <Stethoscope size={26} color="#0F5E56" />
        </div>
        <div>
          <div style={printStyles.clinicName}>{clinicInfo.name}</div>
          <div style={printStyles.clinicSub}>{clinicInfo.address}</div>
          <div style={printStyles.clinicSub}>{clinicInfo.phone}</div>
        </div>
      </div>

      <div style={{ textAlign: "right", fontSize: 12.5, margin: "10px 0 18px" }}>
        <b>Date:</b> <Blank minWidth={140}>{fmtDate(issueDate)}</Blank>
      </div>

      <div style={printStyles.certTitle}>MEDICAL CERTIFICATE</div>

      <div style={{ fontSize: 13, marginTop: 18, lineHeight: 1.9 }}>
        <p>To whom it may concern:</p>
        <p style={{ textIndent: "2em" }}>
          This is to certify that <Blank minWidth={220}>{patient.name}</Blank>,{" "}
          <Blank minWidth={40}>{age !== null ? age : ""}</Blank> years of age,{" "}
          <Blank minWidth={60}>{patient.sex || ""}</Blank> (sex), currently residing in{" "}
          <Blank minWidth={260}>{patient.address || ""}</Blank> consulted and was examined on{" "}
          <Blank minWidth={130}>{fmtDate(cert.examDate)}</Blank> at {clinicInfo.name} for{" "}
          <Blank minWidth={260}>{cert.reason || ""}</Blank>.
        </p>
      </div>

      <div style={{ marginTop: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>Assessment/Impression:</div>
        <div style={printStyles.ruledBlock}>{cert.assessment || ""}</div>
      </div>

      <div style={{ marginTop: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>Recommendation/s:</div>
        <div style={printStyles.ruledBlock}>{cert.recommendation || ""}</div>
      </div>

      <p style={{ fontSize: 13, marginTop: 22, lineHeight: 1.7 }}>
        This certificate is being issued upon the request of the above-mentioned name for whatever
        purpose it may serve, excluding legal matters.
      </p>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 40 }}>
        <div style={printStyles.signatureBlock}>
          <div style={printStyles.signatureLine}>{provider}</div>
          <div style={{ fontSize: 11 }}>Medical Doctor</div>
        </div>
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, marginTop: 26 }}>*Not valid without dry seal</div>
    </div>
  );
}

/* ---------------- Laboratory & Diagnostic Request section ---------------- */
function LabChecklistFields({ checks, onToggle, detailChecks, onToggleDetail, detailText, onDetailTextChange, columns = 3 }) {
  return (
    <div>
      <CheckGroup items={LAB_TEST_CHECKLIST} checked={checks} onToggle={onToggle} columns={columns} />
      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
        {LAB_TEST_WITH_DETAIL.map((label) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ ...styles.checkItem, padding: 0, width: 100, flexShrink: 0 }}>
              <input type="checkbox" checked={!!detailChecks[label]} onChange={() => onToggleDetail(label)} style={{ marginTop: 2 }} />
              <span>{label}</span>
            </label>
            <input
              style={styles.input}
              value={detailText[label] || ""}
              onChange={(e) => onDetailTextChange(label, e.target.value)}
              placeholder={label === "Others" ? "Specify" : "e.g. area / view / type"}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function LabTemplateManager({ labTemplates, persistLabTemplates, onClose, showToast }) {
  const [editingId, setEditingId] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [label, setLabel] = useState("");
  const [checks, setChecks] = useState({});
  const [detailChecks, setDetailChecks] = useState({});
  const [detailText, setDetailText] = useState({});

  function resetEditor() {
    setLabel(""); setChecks({}); setDetailChecks({}); setDetailText({});
    setEditingId(null); setShowEditor(false);
  }

  function startAdd() {
    resetEditor();
    setShowEditor(true);
  }

  function startEdit(tpl) {
    setLabel(tpl.label);
    setChecks(Object.fromEntries(tpl.tests.map((t) => [t, true])));
    setDetailChecks(Object.fromEntries(tpl.details.map((d) => [d.label, true])));
    setDetailText(Object.fromEntries(tpl.details.map((d) => [d.label, d.detail])));
    setEditingId(tpl.id);
    setShowEditor(true);
  }

  async function saveTemplate() {
    const tests = LAB_TEST_CHECKLIST.filter((t) => checks[t]);
    const details = LAB_TEST_WITH_DETAIL.filter((t) => detailChecks[t]).map((t) => ({ label: t, detail: (detailText[t] || "").trim() }));
    if (!label.trim() || (tests.length === 0 && details.length === 0)) return;
    const entry = { id: editingId || uid("labtpl"), label: label.trim(), tests, details };
    const next = editingId ? labTemplates.map((t) => (t.id === editingId ? entry : t)) : [...labTemplates, entry];
    await persistLabTemplates(next);
    showToast(editingId ? "Template updated" : "Template saved");
    resetEditor();
  }

  async function removeTemplate(id) {
    await persistLabTemplates(labTemplates.filter((t) => t.id !== id));
    showToast("Template removed");
  }

  return (
    <Modal title="Lab & diagnostic templates" onClose={onClose}>
      {!showEditor ? (
        <>
          <button style={{ ...styles.primaryBtn, justifyContent: "center", width: "100%", marginBottom: 14 }} onClick={startAdd}>
            <Plus size={15} /> New template
          </button>
          {labTemplates.length === 0 ? (
            <EmptyState text="No templates yet — create one above." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {labTemplates.map((tpl) => (
                <div key={tpl.id} style={styles.patientRow}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: "#12312D" }}>{tpl.label}</div>
                    <div style={{ fontSize: 12, color: "#5B6B68" }}>{tpl.tests.length + tpl.details.length} items</div>
                  </div>
                  <button style={styles.iconBtn} onClick={() => startEdit(tpl)} aria-label="Edit"><Pencil size={14} /></button>
                  <button style={styles.iconBtn} onClick={() => removeTemplate(tpl.id)} aria-label="Remove"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <Field label="Template name">
            <input style={styles.input} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Annual Physical Panel, Pre-Employment" />
          </Field>
          <div style={{ marginTop: 10 }}>
            <LabChecklistFields
              checks={checks}
              onToggle={(l) => setChecks((p) => ({ ...p, [l]: !p[l] }))}
              detailChecks={detailChecks}
              onToggleDetail={(l) => setDetailChecks((p) => ({ ...p, [l]: !p[l] }))}
              detailText={detailText}
              onDetailTextChange={(l, v) => setDetailText((p) => ({ ...p, [l]: v }))}
              columns={2}
            />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button style={{ ...styles.primaryBtn, justifyContent: "center" }} onClick={saveTemplate}>
              <Check size={15} /> {editingId ? "Save changes" : "Save template"}
            </button>
            <button style={{ ...styles.linkBtn, padding: "9px 14px" }} onClick={resetEditor}>Cancel</button>
          </div>
        </>
      )}
    </Modal>
  );
}

function LabRequestSection({ labRequests, onAddLabRequest, patient, clinicInfo, provider, autoOpen, onAutoOpened, labTemplates, persistLabTemplates, showToast }) {
  const [showForm, setShowForm] = useState(false);
  const [checks, setChecks] = useState({});
  const [detailChecks, setDetailChecks] = useState({}); // Xray/Ultrasound/CT-Scan/Others -> bool
  const [detailText, setDetailText] = useState({}); // Xray/Ultrasound/CT-Scan/Others -> free text
  const [printLab, setPrintLab] = useState(null);
  const [showTemplateManager, setShowTemplateManager] = useState(false);

  useEffect(() => {
    if (autoOpen) {
      setShowForm(true);
      onAutoOpened && onAutoOpened();
    }
  }, [autoOpen]);

  function toggleCheck(label) {
    setChecks((prev) => ({ ...prev, [label]: !prev[label] }));
  }
  function toggleDetail(label) {
    setDetailChecks((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  function resetForm() {
    setChecks({});
    setDetailChecks({});
    setDetailText({});
    setShowForm(false);
  }

  // Applying a template adds to whatever's already checked (so two templates can be combined),
  // rather than clearing the rest of the form.
  function applyTemplate(tpl) {
    setChecks((prev) => ({ ...prev, ...Object.fromEntries(tpl.tests.map((t) => [t, true])) }));
    setDetailChecks((prev) => ({ ...prev, ...Object.fromEntries(tpl.details.map((d) => [d.label, true])) }));
    setDetailText((prev) => ({ ...prev, ...Object.fromEntries(tpl.details.map((d) => [d.label, d.detail])) }));
  }

  function handlePrint(l) {
    setPrintLab(l);
    setTimeout(() => window.print(), 60);
  }

  useEffect(() => {
    function afterPrint() { setPrintLab(null); }
    window.addEventListener("afterprint", afterPrint);
    return () => window.removeEventListener("afterprint", afterPrint);
  }, []);

  function saveRequest() {
    const testsChecked = LAB_TEST_CHECKLIST.filter((t) => checks[t]);
    const detailsChecked = LAB_TEST_WITH_DETAIL.filter((t) => detailChecks[t]).map((t) => ({ label: t, detail: (detailText[t] || "").trim() }));
    if (testsChecked.length === 0 && detailsChecked.length === 0) return;
    onAddLabRequest({ tests: testsChecked, details: detailsChecked });
    resetForm();
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 10 }}>
        <button style={styles.linkBtn} onClick={() => setShowTemplateManager(true)}>
          <ClipboardList size={13} /> Manage templates
        </button>
        <button style={styles.primaryBtn} onClick={() => setShowForm((s) => !s)}>
          <Plus size={15} /> New lab &amp; diagnostic request
        </button>
      </div>

      {showTemplateManager && (
        <LabTemplateManager
          labTemplates={labTemplates}
          persistLabTemplates={persistLabTemplates}
          onClose={() => setShowTemplateManager(false)}
          showToast={showToast}
        />
      )}

      {showForm && (
        <div style={styles.card}>
          <div style={{ fontSize: 11.5, color: "#5B6B68", marginBottom: 12 }}>
            Check everything being requested for {patient.name}. Name, address, and age/sex print automatically.
          </div>
          {labTemplates.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "#12312D", marginBottom: 6 }}>Use a template</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {labTemplates.map((tpl) => (
                  <button key={tpl.id} type="button" style={styles.pillToggle} onClick={() => applyTemplate(tpl)}>
                    {tpl.label} ({tpl.tests.length + tpl.details.length})
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 11, color: "#8A9793", marginTop: 6 }}>
                Adds to what's already checked — combine more than one template if needed.
              </div>
            </div>
          )}
          <LabChecklistFields
            checks={checks}
            onToggle={toggleCheck}
            detailChecks={detailChecks}
            onToggleDetail={toggleDetail}
            detailText={detailText}
            onDetailTextChange={(l, v) => setDetailText((prev) => ({ ...prev, [l]: v }))}
            columns={3}
          />
          <button style={{ ...styles.primaryBtn, justifyContent: "center", marginTop: 14 }} onClick={saveRequest}>
            <Check size={15} /> Save request
          </button>
        </div>
      )}

      <SectionCard title="Lab & diagnostic requests on file">
        {labRequests.length === 0 ? (
          <EmptyState text="No lab or diagnostic requests yet." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {labRequests.map((l) => (
              <div key={l.id} style={styles.entryCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={styles.entryDate}>{fmtDateTime(l.date)} · {l.provider}</div>
                  <button style={styles.linkBtn} onClick={() => handlePrint(l)}>
                    <FileText size={13} /> Print
                  </button>
                </div>
                <div style={{ fontSize: 13, color: "#12312D", marginTop: 4 }}>
                  {[...l.tests, ...l.details.map((d) => (d.detail ? `${d.label}: ${d.detail}` : d.label))].join(", ")}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <div id="lab-print-area">
        {printLab && <PrintableLabRequest lab={printLab} patient={patient} clinicInfo={clinicInfo} provider={printLab.provider || provider} />}
      </div>
    </div>
  );
}

/* ---------------- Printable Lab & Diagnostic Request (matches clinic template) ---------------- */
function PrintableLabRequest({ lab, patient, clinicInfo, provider }) {
  const age = calcAge(patient.dob);
  const issueDate = new Date(lab.date || Date.now());
  const checkedSet = new Set(lab.tests);
  const detailMap = Object.fromEntries((lab.details || []).map((d) => [d.label, d.detail]));
  const half = Math.ceil(LAB_TEST_CHECKLIST.length / 2);
  const colA = LAB_TEST_CHECKLIST.slice(0, half);
  const colB = LAB_TEST_CHECKLIST.slice(half);

  return (
    <div style={printStyles.page}>
      <div style={printStyles.headerRow}>
        <div style={printStyles.logoCircle}>
          <Stethoscope size={26} color="#0F5E56" />
        </div>
        <div>
          <div style={printStyles.clinicName}>{clinicInfo.name}</div>
          <div style={printStyles.clinicSub}>{clinicInfo.address}</div>
          <div style={printStyles.clinicSub}>Contact number {clinicInfo.phone}</div>
        </div>
      </div>

      <div style={{ ...printStyles.certTitle, letterSpacing: 2 }}>LABORATORY AND DIAGNOSTIC REQUEST</div>

      <div style={{ fontSize: 12.5, marginTop: 16 }}>
        Name: <Blank minWidth={320}>{patient.name}</Blank> &nbsp;&nbsp; Date: <Blank minWidth={110}>{fmtDate(issueDate)}</Blank>
      </div>
      <div style={{ fontSize: 12.5, marginTop: 10 }}>
        Address: <Blank minWidth={320}>{patient.address || ""}</Blank> &nbsp;&nbsp; Age/Sex: <Blank minWidth={90}>{age !== null ? `${age}` : ""}{age !== null && patient.sex ? " / " : ""}{(patient.sex || "").slice(0, 1)}</Blank>
      </div>

      <div style={{ display: "flex", gap: 30, marginTop: 20 }}>
        {[colA, colB].map((col, ci) => (
          <div key={ci} style={{ flex: 1, fontSize: 12.5, lineHeight: 1.9 }}>
            {col.map((t) => (
              <div key={t}>{checkedSet.has(t) ? "☑" : "☐"} {t}</div>
            ))}
            {ci === 1 && LAB_TEST_WITH_DETAIL.map((label) => (
              <div key={label}>
                {detailChecked(detailMap, label) ? "☑" : "☐"} {label}: <Blank minWidth={110}>{detailMap[label] || ""}</Blank>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 44 }}>
        <div style={printStyles.signatureBlock}>
          <div style={printStyles.signatureLine}>{provider}, MD</div>
          <div style={{ fontSize: 11 }}>License No. _____________</div>
        </div>
      </div>
    </div>
  );
}
function detailChecked(detailMap, label) {
  return Object.prototype.hasOwnProperty.call(detailMap, label);
}

/* ---------------- Medications (editable, shared across the clinic) ---------------- */
function MedicationsPage({ commonMeds, persistCommonMeds, showToast }) {
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");

  const list = commonMeds;
  const filtered = list.filter((m) => m.name.toLowerCase().includes(query.toLowerCase()));

  function resetForm() {
    setName(""); setDosage(""); setFrequency(""); setDuration(""); setNotes("");
    setEditingIndex(null); setShowForm(false);
  }

  function startAdd() {
    resetForm();
    setShowForm(true);
  }

  function startEdit(idx) {
    const m = list[idx];
    setName(m.name); setDosage(m.dosage); setFrequency(m.frequency); setDuration(m.duration); setNotes(m.notes || "");
    setEditingIndex(idx);
    setShowForm(true);
  }

  async function saveMed() {
    if (!name.trim()) return;
    const entry = { name: name.trim(), dosage: dosage.trim(), frequency: frequency.trim(), duration: duration.trim(), notes: notes.trim() };
    const nextList = editingIndex === null ? [...list, entry] : list.map((m, i) => (i === editingIndex ? entry : m));
    await persistCommonMeds(nextList);
    showToast(editingIndex === null ? "Medication added" : "Medication updated");
    resetForm();
  }

  async function removeMed(idx) {
    const nextList = list.filter((_, i) => i !== idx);
    await persistCommonMeds(nextList);
    showToast("Medication removed");
  }

  return (
    <div>
      <div style={styles.pageHeader}>
        <h2 style={styles.h2}>Medications</h2>
        <button style={styles.primaryBtn} onClick={startAdd}><Plus size={15} /> Add medication</button>
      </div>
      <div style={{ fontSize: 12.5, color: "#5B6B68", marginBottom: 14 }}>
        One shared list for every prescription — adult and pediatric medications together. Pick whichever's
        right for the patient in front of you when writing a prescription.
      </div>

      <div style={{ position: "relative", marginBottom: 14 }}>
        <Search size={15} style={{ position: "absolute", left: 12, top: 11, color: "#8A9793" }} />
        <input
          style={{ ...styles.input, paddingLeft: 34 }}
          placeholder="Search medications…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {showForm && (
        <div style={styles.card}>
          <div style={{ fontSize: 11.5, color: "#5B6B68", marginBottom: 10 }}>
            This is what shows up as a suggestion when staff type a medication name into any patient's prescription.
          </div>
          <Field label="Medication name">
            <input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Amoxicillin 500mg (Brand)" />
          </Field>
          <div style={{ display: "flex", gap: 10 }}>
            <Field label="Dosage" style={{ flex: 1 }}>
              <input style={styles.input} value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="e.g. 1 tab" />
            </Field>
            <Field label="Frequency" style={{ flex: 1 }}>
              <input style={styles.input} value={frequency} onChange={(e) => setFrequency(e.target.value)} placeholder="e.g. AM & PM (2x/day)" />
            </Field>
          </div>
          <Field label="Duration">
            <input style={styles.input} value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 7 days" />
          </Field>
          <Field label="Notes (optional)">
            <input style={styles.input} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Antibiotic — after meals" />
          </Field>
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <button style={{ ...styles.primaryBtn, justifyContent: "center" }} onClick={saveMed}>
              <Check size={15} /> {editingIndex === null ? "Add medication" : "Save changes"}
            </button>
            <button style={{ ...styles.linkBtn, padding: "9px 14px" }} onClick={resetForm}>Cancel</button>
          </div>
        </div>
      )}

      <SectionCard title={`Medication list (${filtered.length})`}>
        {filtered.length === 0 ? (
          <EmptyState text={list.length === 0 ? "No medications yet — add the first one above." : "No matches."} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map((m) => {
              const idx = list.indexOf(m);
              return (
                <div key={m.name + idx} style={styles.patientRow}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: "#12312D" }}>{m.name}</div>
                    <div style={{ fontSize: 12, color: "#5B6B68" }}>
                      {[m.dosage, m.frequency, m.duration, m.notes].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <button style={styles.iconBtn} onClick={() => startEdit(idx)} aria-label="Edit"><Pencil size={14} /></button>
                  <button style={styles.iconBtn} onClick={() => removeMed(idx)} aria-label="Remove"><Trash2 size={14} /></button>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

/* ---------------- Rx Templates (diagnosis bundles) ---------------- */
function RxTemplatesPage({ rxTemplates, persistRxTemplates, commonMeds, showToast }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [label, setLabel] = useState("");
  const [meds, setMeds] = useState([{ name: "", qty: "", am: "", nn: "", pm: "", remarks: "" }]);
  const [openSuggestRow, setOpenSuggestRow] = useState(null);

  const list = rxTemplates;
  const medList = commonMeds;

  function resetForm() {
    setLabel("");
    setMeds([{ name: "", qty: "", am: "", nn: "", pm: "", remarks: "" }]);
    setEditingId(null);
    setShowForm(false);
  }

  function startAdd() {
    resetForm();
    setShowForm(true);
  }

  function startEdit(tpl) {
    setLabel(tpl.label);
    setMeds(tpl.meds.map((m) => ({ ...m })));
    setEditingId(tpl.id);
    setShowForm(true);
  }

  function updateMed(i, field, val) {
    setMeds((m) => m.map((row, idx) => (idx === i ? { ...row, [field]: val } : row)));
  }
  function addMedRow() {
    setMeds((m) => [...m, { name: "", qty: "", am: "", nn: "", pm: "", remarks: "" }]);
  }
  function removeMedRow(i) {
    setMeds((m) => m.filter((_, idx) => idx !== i));
  }
  function pickSuggestion(i, med) {
    const slots = deriveDoseSlots(med.frequency, med.dosage);
    const remarks = buildRemarks(med.duration, med.notes);
    setMeds((m) => m.map((row, idx) => (idx === i ? { ...row, name: med.name, am: slots.am, nn: slots.nn, pm: slots.pm, remarks } : row)));
    setOpenSuggestRow(null);
  }

  async function saveTemplate() {
    const validMeds = meds.filter((m) => m.name.trim());
    if (!label.trim() || validMeds.length === 0) return;
    const entry = { id: editingId || uid("tpl"), label: label.trim(), meds: validMeds };
    const nextList = editingId ? list.map((t) => (t.id === editingId ? entry : t)) : [...list, entry];
    await persistRxTemplates(nextList);
    showToast(editingId ? "Template updated" : "Template created");
    resetForm();
  }

  async function removeTemplate(id) {
    const nextList = list.filter((t) => t.id !== id);
    await persistRxTemplates(nextList);
    showToast("Template removed");
  }

  return (
    <div>
      <div style={styles.pageHeader}>
        <h2 style={styles.h2}>Rx Templates</h2>
        <button style={styles.primaryBtn} onClick={startAdd}><Plus size={15} /> New template</button>
      </div>
      <div style={{ fontSize: 12.5, color: "#5B6B68", marginBottom: 14 }}>
        Save a diagnosis as a bundle of medications (like "PCAP A-B" or "URTI") so a whole prescription
        fills in with one click instead of adding each drug by hand. One shared list — pick whichever
        template fits the patient in front of you.
      </div>

      {showForm && (
        <div style={styles.card}>
          <Field label="Diagnosis / template name">
            <input style={styles.input} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. PCAP A-B, URTI, Bronchitis" />
          </Field>

          <div style={{ display: "flex", gap: 8, fontSize: 11, color: "#8A9793", padding: "10px 0 4px", fontWeight: 600 }}>
            <div style={{ flex: 2 }}></div>
            <div style={{ width: 56, textAlign: "center" }}>No.</div>
            <div style={{ width: 50, textAlign: "center" }}>AM</div>
            <div style={{ width: 50, textAlign: "center" }}>NN</div>
            <div style={{ width: 50, textAlign: "center" }}>PM</div>
            <div style={{ flex: 1.4 }}></div>
          </div>
          {meds.map((row, i) => {
            const q = row.name.trim().toLowerCase();
            const suggestions = q.length >= 3 ? medList.filter((m) => m.name.toLowerCase().includes(q)).slice(0, 6) : [];
            return (
              <div key={i} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                  <Field label="Medication" style={{ flex: 2, position: "relative" }}>
                    <input
                      style={styles.input}
                      value={row.name}
                      onChange={(e) => { updateMed(i, "name", e.target.value); setOpenSuggestRow(i); }}
                      onFocus={() => setOpenSuggestRow(i)}
                      onBlur={() => setTimeout(() => setOpenSuggestRow((r) => (r === i ? null : r)), 120)}
                      placeholder="Start typing…"
                      autoComplete="off"
                    />
                    {openSuggestRow === i && suggestions.length > 0 && (
                      <div style={styles.suggestBox}>
                        {suggestions.map((m) => (
                          <div key={m.name} style={styles.suggestItem} onMouseDown={() => pickSuggestion(i, m)}>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</div>
                            <div style={{ fontSize: 11.5, color: "#5B6B68" }}>{m.dosage} · {m.frequency} · {m.duration}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Field>
                  <input style={{ ...styles.input, width: 56, textAlign: "center" }} value={row.qty} onChange={(e) => updateMed(i, "qty", e.target.value)} placeholder="No." />
                  <input style={{ ...styles.input, width: 50, textAlign: "center" }} value={row.am} onChange={(e) => updateMed(i, "am", e.target.value)} placeholder="0" />
                  <input style={{ ...styles.input, width: 50, textAlign: "center" }} value={row.nn} onChange={(e) => updateMed(i, "nn", e.target.value)} placeholder="0" />
                  <input style={{ ...styles.input, width: 50, textAlign: "center" }} value={row.pm} onChange={(e) => updateMed(i, "pm", e.target.value)} placeholder="0" />
                  <input style={{ ...styles.input, flex: 1.4 }} value={row.remarks} onChange={(e) => updateMed(i, "remarks", e.target.value)} placeholder="e.g. for 7 days after meals" />
                  {meds.length > 1 && (
                    <button style={styles.iconBtn} onClick={() => removeMedRow(i)} aria-label="Remove"><Trash2 size={14} /></button>
                  )}
                </div>
              </div>
            );
          })}
          <button style={styles.linkBtn} onClick={addMedRow}><Plus size={13} /> Add another medication</button>

          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button style={{ ...styles.primaryBtn, justifyContent: "center" }} onClick={saveTemplate}>
              <Check size={15} /> {editingId ? "Save changes" : "Save template"}
            </button>
            <button style={{ ...styles.linkBtn, padding: "9px 14px" }} onClick={resetForm}>Cancel</button>
          </div>
        </div>
      )}

      <SectionCard title={`Templates (${list.length})`}>
        {list.length === 0 ? (
          <EmptyState text="No templates yet — create one above." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {list.map((tpl) => (
              <div key={tpl.id} style={styles.patientRow}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: "#12312D" }}>{tpl.label}</div>
                  <div style={{ fontSize: 12, color: "#5B6B68" }}>{tpl.meds.length} medications</div>
                </div>
                <button style={styles.iconBtn} onClick={() => startEdit(tpl)} aria-label="Edit"><Pencil size={14} /></button>
                <button style={styles.iconBtn} onClick={() => removeTemplate(tpl.id)} aria-label="Remove"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

/* ---------------- Staff directory (read-only list; logins are managed in Supabase) ---------------- */
function StaffDirectory({ staffList, showToast, clinicInfo, persistClinicInfo }) {
  const [editingClinic, setEditingClinic] = useState(false);
  const [clinicName, setClinicName] = useState(clinicInfo.name);
  const [clinicAddress, setClinicAddress] = useState(clinicInfo.address);
  const [clinicPhone, setClinicPhone] = useState(clinicInfo.phone);

  async function saveClinic() {
    await persistClinicInfo({ name: clinicName.trim(), address: clinicAddress.trim(), phone: clinicPhone.trim() });
    showToast("Clinic info updated");
    setEditingClinic(false);
  }

  return (
    <div>
      <div style={styles.pageHeader}>
        <h2 style={styles.h2}>Staff</h2>
      </div>

      <SectionCard
        title="Clinic info (shown on printed prescriptions)"
        action={
          !editingClinic && (
            <button style={styles.linkBtn} onClick={() => setEditingClinic(true)}>Edit</button>
          )
        }
      >
        {editingClinic ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Field label="Clinic name">
              <input style={styles.input} value={clinicName} onChange={(e) => setClinicName(e.target.value)} />
            </Field>
            <Field label="Address">
              <input style={styles.input} value={clinicAddress} onChange={(e) => setClinicAddress(e.target.value)} />
            </Field>
            <Field label="Phone">
              <input style={styles.input} value={clinicPhone} onChange={(e) => setClinicPhone(e.target.value)} />
            </Field>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ ...styles.primaryBtn, justifyContent: "center" }} onClick={saveClinic}><Check size={15} /> Save</button>
              <button
                style={{ ...styles.linkBtn, padding: "9px 14px" }}
                onClick={() => {
                  setClinicName(clinicInfo.name); setClinicAddress(clinicInfo.address); setClinicPhone(clinicInfo.phone);
                  setEditingClinic(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 13.5, color: "#2A3B38", lineHeight: 1.6 }}>
            <div style={{ fontWeight: 600 }}>{clinicInfo.name}</div>
            <div>{clinicInfo.address}</div>
            <div>{clinicInfo.phone}</div>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Directory">
        <div style={{ fontSize: 12, color: "#8A9793", marginBottom: 10 }}>
          To add a new staff member, create their login in the Supabase dashboard (Authentication → Users →
          Add user). They'll set their name and role themselves the first time they sign in.
        </div>
        {staffList.length === 0 ? (
          <EmptyState text="No staff profiles yet." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {staffList.map((s) => (
              <div key={s.id} style={styles.patientRow}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: "#12312D" }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: "#5B6B68" }}>{s.role}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

/* ---------------- Shared bits ---------------- */
function Field({ label, children, style }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, ...style }}>
      <label style={styles.label}>{label}</label>
      {children}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#12312D" }}>{title}</div>
          <button style={styles.iconBtn} onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------------- Styles ---------------- */
const styles = {
  app: { display: "flex", minHeight: "100vh", background: "#F7F8F7", fontFamily: "Inter, system-ui, sans-serif" },
  sidebar: { width: 210, background: "#0F2925", display: "flex", flexDirection: "column", minHeight: "100vh" },
  main: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0 },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "18px 28px 10px" },
  content: { padding: "0 28px 40px", flex: 1 },
  centerScreen: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F7F8F7", fontFamily: "Inter, system-ui, sans-serif" },
  loadingPulse: { color: "#5B6B68", fontSize: 14 },
  signInCard: { background: "#fff", borderRadius: 14, padding: 28, width: 360, boxShadow: "0 8px 30px rgba(15,45,40,0.08)", border: "1px solid #E4EAE8" },
  label: { fontSize: 11.5, color: "#5B6B68", fontWeight: 600, letterSpacing: 0.2, textTransform: "uppercase" },
  input: { padding: "9px 11px", borderRadius: 8, border: "1px solid #DCE3E1", fontSize: 13.5, background: "#fff", color: "#12312D", outline: "none", width: "100%", boxSizing: "border-box" },
  primaryBtn: { display: "inline-flex", alignItems: "center", gap: 6, background: "#0F5E56", color: "#fff", border: "none", borderRadius: 8, padding: "9px 14px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" },
  staffPickBtn: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 11px", borderRadius: 8, border: "1px solid #DCE3E1", background: "#FBFCFB", cursor: "pointer", fontSize: 13.5, color: "#12312D" },
  roleTag: { fontSize: 11, color: "#0F5E56", background: "#EAF3F1", padding: "2px 8px", borderRadius: 20 },
  banner: { display: "flex", gap: 10, alignItems: "flex-start", background: "#FBF1DF", border: "1px solid #EAD6A8", borderRadius: 10, padding: "10px 12px", margin: "18px 0" },
  bannerClose: { background: "none", border: "none", cursor: "pointer", color: "#8A4B12", padding: 2 },
  navBtn: { display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", color: "#B9CBC8", padding: "9px 10px", borderRadius: 8, fontSize: 13.5, cursor: "pointer", textAlign: "left" },
  navBtnActive: { background: "rgba(255,255,255,0.08)", color: "#fff" },
  signOutBtn: { display: "flex", alignItems: "center", gap: 6, background: "none", border: "1px solid rgba(255,255,255,0.15)", color: "#B9CBC8", borderRadius: 8, padding: "6px 10px", fontSize: 12, cursor: "pointer", width: "100%", justifyContent: "center" },
  statRow: { display: "flex", gap: 14, margin: "20px 0" },
  statCard: { flex: 1, display: "flex", alignItems: "center", gap: 12, background: "#fff", border: "1px solid #E4EAE8", borderRadius: 12, padding: 16 },
  statIconWrap: { width: 34, height: 34, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" },
  card: { background: "#fff", border: "1px solid #E4EAE8", borderRadius: 12, padding: 18, marginBottom: 16 },
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", margin: "20px 0 16px" },
  h2: { fontFamily: "Fraunces, serif", fontSize: 22, color: "#12312D", margin: 0 },
  apptRow: { display: "flex", alignItems: "center", gap: 12, padding: "9px 12px", borderRadius: 9, border: "1px solid #EDF1F0", cursor: "pointer" },
  patientRow: { display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", borderRadius: 10, border: "1px solid #E4EAE8", background: "#fff", cursor: "pointer" },
  avatarDot: { width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  pill: { fontSize: 11, background: "#F1F4F3", color: "#5B6B68", padding: "2px 9px", borderRadius: 20 },
  allergyTag: { display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, background: "#FBE7E7", color: "#B23B3B", padding: "3px 9px", borderRadius: 20, fontWeight: 600 },
  mono: { fontFamily: "IBM Plex Mono, monospace", fontSize: 12.5, color: "#12312D" },
  backBtn: { display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: "#5B6B68", fontSize: 13, cursor: "pointer", padding: "16px 0 4px" },
  patientHeader: { display: "flex", alignItems: "center", gap: 14, padding: "14px 0 18px" },
  tabRow: { display: "flex", gap: 6, borderBottom: "1px solid #E4EAE8", marginBottom: 18 },
  tabBtn: { display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", borderBottom: "2px solid transparent", padding: "9px 6px", fontSize: 13, color: "#5B6B68", cursor: "pointer" },
  tabBtnActive: { color: "#0F5E56", borderBottom: "2px solid #0F5E56", fontWeight: 600 },
  entryCard: { border: "1px solid #EDF1F0", borderRadius: 10, padding: "12px 14px" },
  entryDate: { fontSize: 11, color: "#8A9793", fontFamily: "IBM Plex Mono, monospace", marginBottom: 4 },
  iconBtn: { background: "none", border: "none", color: "#8A9793", cursor: "pointer", padding: 4 },
  linkBtn: { display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", color: "#0F5E56", fontSize: 12.5, cursor: "pointer", padding: "2px 0 10px", fontWeight: 600 },
  suggestBox: { position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: "1px solid #DCE3E1", borderRadius: 9, boxShadow: "0 10px 26px rgba(15,45,40,0.14)", zIndex: 20, maxHeight: 240, overflowY: "auto" },
  suggestItem: { padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid #F1F4F3", color: "#12312D" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(15,41,37,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 },
  modalCard: { background: "#fff", borderRadius: 14, padding: 22, width: 460, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(15,45,40,0.2)" },
  toast: { position: "fixed", bottom: 22, left: "50%", transform: "translateX(-50%)", background: "#12312D", color: "#fff", padding: "10px 18px", borderRadius: 10, fontSize: 13, boxShadow: "0 8px 24px rgba(0,0,0,0.2)" },
  subNavRow: { display: "flex", gap: 8, marginBottom: 14 },
  subNavBtn: { background: "#F1F4F3", border: "1px solid #E4EAE8", color: "#5B6B68", borderRadius: 20, padding: "7px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" },
  subNavBtnActive: { background: "#0F5E56", borderColor: "#0F5E56", color: "#fff" },
  pillToggle: { background: "#fff", border: "1px solid #DCE3E1", color: "#5B6B68", borderRadius: 20, padding: "6px 13px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" },
  pillToggleActive: { background: "#0F5E56", borderColor: "#0F5E56", color: "#fff" },
  checkItem: { display: "flex", gap: 6, alignItems: "flex-start", fontSize: 12.5, color: "#2A3B38", padding: "3px 0", breakInside: "avoid" },
};

const globalCss = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
  * { box-sizing: border-box; }
  input:focus, select:focus, textarea:focus, button:focus-visible {
    outline: 2px solid #0F5E56; outline-offset: 1px;
  }
  #rx-print-area, #cert-print-area, #exam-print-area, #lab-print-area { display: none; }
  @media print {
    body * { visibility: hidden; }
    #rx-print-area, #rx-print-area *, #cert-print-area, #cert-print-area *, #exam-print-area, #exam-print-area *, #lab-print-area, #lab-print-area * { visibility: visible; }
    #rx-print-area, #cert-print-area, #exam-print-area, #lab-print-area { display: block; position: absolute; top: 0; left: 0; width: 100%; }
    @page { margin: 10mm; }
  }
`;

/* ---------------- Print layout styles (matches clinic Rx pad / cert) ---------------- */
const printStyles = {
  page: { fontFamily: "Arial, Helvetica, sans-serif", color: "#111", padding: "8mm", maxWidth: "190mm" },
  headerRow: { display: "flex", alignItems: "center", gap: 14, borderBottom: "2px solid #0F5E56", paddingBottom: 10, marginBottom: 12 },
  logoCircle: { width: 50, height: 50, borderRadius: "50%", border: "2px solid #0F5E56", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  clinicName: { fontSize: 19, fontWeight: 800, color: "#0F5E56", letterSpacing: 0.3 },
  clinicSub: { fontSize: 11.5, color: "#333" },
  fieldsRow: { display: "flex", gap: 24, marginBottom: 14 },
  fieldsCol: { flex: 1, display: "flex", flexDirection: "column", gap: 6 },
  fieldLine: { fontSize: 12.5, borderBottom: "1px solid #999", paddingBottom: 2 },
  rxMark: { fontSize: 34, fontWeight: 800, color: "#555", margin: "6px 0 14px" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 12 },
  th: { border: "1px solid #333", padding: "5px 6px", background: "#F1F4F3", textAlign: "left", fontSize: 11.5 },
  td: { border: "1px solid #333", padding: "6px 6px", verticalAlign: "top" },
  tdCenter: { border: "1px solid #333", padding: "6px 6px", textAlign: "center", verticalAlign: "top" },
  footerRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 34 },
  followUp: { fontSize: 12.5 },
  signatureBlock: { textAlign: "center", minWidth: 180 },
  signatureLine: { borderTop: "1px solid #333", paddingTop: 4, fontSize: 12.5, fontWeight: 600 },
  certTitle: { textAlign: "center", fontSize: 17, fontWeight: 800, marginTop: 8, letterSpacing: 0.5 },
  blank: { display: "inline-block", borderBottom: "1px solid #333", padding: "0 4px 1px", fontWeight: 600 },
  ruledBlock: { fontSize: 12.5, lineHeight: 2.1, borderBottom: "1px solid #999", minHeight: 68, marginTop: 4, whiteSpace: "pre-wrap" },
  examHeader: { textAlign: "center", borderBottom: "2px solid #111", paddingBottom: 10, marginBottom: 4 },
  captionLabel: { fontSize: 10, color: "#555", textAlign: "center", marginTop: 2 },
  checkGrid: { columns: 3, WebkitColumns: 3, columnGap: 20, fontSize: 11.5, marginTop: 4 },
  checkLine: { breakInside: "avoid", padding: "2px 0" },
};
