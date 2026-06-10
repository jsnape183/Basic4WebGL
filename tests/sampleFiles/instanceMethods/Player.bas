Class Player

dim health

Constructor(startHealth)
  self.health = startHealth
EndConstructor

function takeDamage(amount)
  self.health = self.health - amount
endfunction

function getHealth()
  return self.health
endfunction
