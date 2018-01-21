/*
 * Zenbot 4 Genetic Backtester
 * Clifford Roche <clifford.roche@gmail.com>
 * 07/01/2017
 */

let PROPERTY_MUTATION_CHANCE = 0.30;
let PROPERTY_CROSSOVER_CHANCE = 0.50;
let SIMILARITY_PERCETANGE = 10;
let CREATE_SIMILAR_MUTATION_CHANCE_INCREASE = 2;
let MUTATE_SIMILAR_FITNESS_THRESHOLD = 0.5;

module.exports = {
  create: function(strategy) {
    // console.log(">>>>>>>>Creating a new phenotype")
    var r = {};
    for (var k in strategy) {
      var v = strategy[k];
      if (v.type === 'int') {
        r[k] = Math.floor((Math.random() * (v.max - v.min + 1)) + v.min);
      } else if (v.type === 'int0') {
      	r[k] = 0;
      	if (Math.random() >= 0.5) {
      	  r[k] = Math.floor((Math.random() * (v.max - v.min + 1)) + v.min);
      	}
      } else if (v.type === 'intfactor') {
        // possible 0 value by providing min 0
      	if (v.min == 0 && Math.random() <= 0.5) r[k] = 0;
        else r[k] = Math.round((Math.random() * (v.max - v.min + 1)/v.factor)*v.factor);
      } else if (v.type === 'float') {
        r[k] = (Math.random() * (v.max - v.min)) + v.min;
      } else if (v.type === 'makertaker') {
        r[k] = (Math.random() > 0.5) ? 'maker' : 'taker';
      } else if (v.type === 'taker') {
        r[k] = 'taker';
      } else if (v.type === 'maker') {
        r[k] = 'maker';
      } else if (v.type === 'sigmoidtanhrelu') {
        var items = ['sigmoid', 'tanh', 'relu'];
        var index = Math.floor(Math.random() * items.length);
        r[k] = items[index];
      } else if (v.type === 'period_length') {
        var s = Math.floor((Math.random() * (v.max - v.min + 1)) + v.min);
        r[k] = s + v.period_length;
      }
    }
    return r;
  },

  // Creates a phenotype with traits within numeric traits a certain percentage of supplied one
  createSimilar: function(strategy, phenotype, percentageSimilarity) {
    console.log(">>>>>>>>Creating a variant phenotype")
    var r = {};

    for (var trait in phenotype) {
      if (trait === 'sim') continue;
      var value = phenotype[trait]
      var type = strategy[trait].type
      var direction = Math.random() >= 0.5?1:-1

      if (type === 'int' || type === 'int0' || type === 'intfactor') {
        value = parseInt(value) + parseInt(direction*parseInt(value)*parseFloat(percentageSimilarity/100))
      } else if (type === 'float') {
        value = parseFloat(value) + parseFloat(direction*parseFloat(value)*parseFloat(percentageSimilarity/100))
      } else if (type === 'period_length') {
        s = parseInt(value) + parseInt(direction*parseInt(value)*parseFloat(percentageSimilarity/100))
        s < strategy[trait].min?s = strategy[trait].min:s
        s > strategy[trait].max?strategy[trait].max:s
        value = s + strategy[trait].period_length
      } else if (type === 'makertaker') {
        r[trait] = (Math.random() > 0.5) ? 'maker' : 'taker'
        return r
      } else if (type === 'sigmoidtanhrelu') {
        var items = ['sigmoid', 'tanh', 'relu']
        var index = Math.floor(Math.random() * items.length)
        r[trait] = items[index]
        return r
      }

      value < strategy[trait].min?value = strategy[trait].min:value
      value > strategy[trait].max?strategy[trait].max:value

      r[trait] = value
    }

    return r;
  },

  mutation: function(oldPhenotype, strategy) {
    // console.log('>>>>>>>>Mutating')
    // console.log('>>>>>>>BEFORE' + JSON.stringify(oldPhenotype))
    var mutationChance = PROPERTY_MUTATION_CHANCE
    var r = module.exports.create(strategy);
    if (module.exports.fitness(oldPhenotype) > MUTATE_SIMILAR_FITNESS_THRESHOLD) {
      console.log('-------->Mutating a similar rather than a new')
      r = module.exports.createSimilar(strategy, oldPhenotype, SIMILARITY_PERCETANGE)
      mutationChance = mutationChance * CREATE_SIMILAR_MUTATION_CHANCE_INCREASE
    }

    for (var k in oldPhenotype) {
      if (k === 'sim') continue;
      var v = oldPhenotype[k];
      r[k] = (Math.random() < mutationChance) ? r[k] : oldPhenotype[k];
    }
    // console.log(">>>>>> AFTER" + JSON.stringify(r))

    return r;
  },

  crossover: function(phenotypeA, phenotypeB, strategy) {
    // console.log(">>>>>>>>>Crossover")

    var p1 = {};
    var p2 = {};
    for (var k in strategy) {
      if (k === 'sim') continue;
      p1[k] = Math.random() >= PROPERTY_CROSSOVER_CHANCE ? phenotypeA[k] : phenotypeB[k];
      p2[k] = Math.random() >= PROPERTY_CROSSOVER_CHANCE ? phenotypeA[k] : phenotypeB[k];
    }

    return [p1, p2];
  },

  fitness: function(phenotype) {

    if (typeof phenotype.sim === 'undefined') return 0;

    var vsBuyHoldRate = (phenotype.sim.vsBuyHold / 50);
    var wlRatio = phenotype.sim.wins - phenotype.sim.losses
    var wlRatioRate = 1.0 / (1.0 + Math.pow(2.71828, (wlRatio*-1)));
    var rate = vsBuyHoldRate * (wlRatioRate);

    return rate;
  },

  competition: function(phenotypeA, phenotypeB) {
    // TODO: Refer to genetic algorithm documentation on how to improve this with diverstiy
    // console.log(">>>>> A, fitness " + module.exports.fitness(phenotypeA) + " competing against B, fitness " + module.exports.fitness(phenotypeB));
    // console.log(">>>>>>>PHENOTYPEA " + JSON.stringify(phenotypeA))
    // console.log(">>>>>>>PHENOTYPEB " + JSON.stringify(phenotypeB))

    return module.exports.fitness(phenotypeA) >= module.exports.fitness(phenotypeB);
  }
};
