<!DOCTYPE html> <?php

$errors = [];
$succcess = [];

if (!empty($_POST)){
	$name = $_POST['name'];
	$email = $_POST['email'];
	$title = $_POST['subject'];
	$message = $_POST['message'];

	if (empty($name)) {
        $errors[] = 'Name ist leer. Es muss ein Name ausgefüllt werden.';
    }

    if (empty($email)) {
        $errors[] = 'E-Mail wurde nicht ausgefüllt.';
    } else if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'Das eingebene E-Mail Format ist nicht gültig.';
	}
	
    if (empty($title)) {
        $errors[] = 'Titel ist leer, muss aber ausgefüllt werden.';
    }

    if (empty($message)) {
        $errors[] = 'Message wurde nicht ausgefüllt!';
	}
	
	if (empty($errors)) {
        $toEmail = 'gatschet@tobias-gatschet.ch';
        $emailSubject = $title;
        $headers = ['From' => $email, 'Reply-To' => $email, 'Content-type' => 'text/html; charset=iso-8859-1'];

        $bodyParagraphs = ["Name: {$name}<br>", "E-Mail: {$email}<br>", "Message:", $message];
        $body = join(PHP_EOL, $bodyParagraphs);

        if (mail($toEmail, $emailSubject, $body, $headers)) {
            $succcess[] = 'Email wurde erfolgreich versendet.';
        } else {
            $errorMessage = 'Oops, something went wrong. Please try again later';
        }
    } else {
        $allErrors = join('<br/>', $errors);
        $errorMessage = "<p style='color: red;'>{$allErrors}</p>";
    }
}

?> <html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="user-scalable=no,width=device-width,initial-scale=1"><meta name="apple-mobile-web-app-capable" content="yes"><title>Tobias Gatschet</title><link href="index.css" rel="stylesheet"></head><body><header><div class="logo_section"><div class="logo"><img src="./assets/images/logo_gruenliberale_RGB.jpg" alt="glp Logo"></div><div class="name">TOBIAS GATSCHET</div></div></header><nav><input type="checkbox" id="menu_check"> <label for="menu_check" class="menu_checkbtn"><i class="fas fa-bars"></i></label><ul><li><a href="./index.html">Über mich</a></li><li><a href="./wahlen.html">Wahlen 2021</a></li><li><a href="./politic.html">Politik</a></li><li><a href="./beruf.html">Berufserfahrung / Ausbildung</a></li><li class="active"><a href="#">Kontakt</a></li></ul></nav> <?php
			if(!empty($succcess)){
				echo "<div class='success-message'>E-Mail wurde erfolgreich versendet. Danke für euren Input, ich werde mich schnellstmöglich bei Ihnen melden.</div>";
			}
		?> <section class="contact"><p>Haben sie eine Frage, einen Kommentar oder ein Anliegen. Kontaktieren sie mich direkt oder über eine der Social Media Plattform. Ich antworte und diskutiere gerne über ihr Anliegen.</p><div class="contact-input"><form method="POST"><input type="text" name="name" class="" id="name" maxlength="50" placeholder=" " required autocomplete="off"> <label for="name"><span>Ihr Name</span></label> <input type="email" name="email" class="" id="email" maxlength="50" placeholder=" " required autocomplete="off"> <label for="email"><span>Ihre Email</span></label> <input type="text" name="subject" class="" id="subject" maxlength="50" placeholder=" " required autocomplete="off"> <label for="subject"><span>Betreff</span></label> <textarea type="text" name="message" class="" id="message" maxlength="1000" rows="3" placeholder=" " required autocomplete="off"></textarea> <label for="message"><span>Ihre Message</span></label> <input class="btn-submit" type="submit" placeholder=" "></form></div></section><footer><div class="footer-social-media"><a target="_blank" href="https://www.facebook.com/tobias.gatschet"><i class="fab fa-facebook-f"></i></a> <a target="_blank" href="https://twitter.com/saibottob"><i class="fab fa-twitter"></i></a> <a target="_blank" href="https://www.linkedin.com/in/tobias-gatschet-396441198/"><i class="fab fa-linkedin"></i></a> <a target="_blank" href="https://www.instagram.com/ramziagob/"><i class="fab fa-instagram"></i></a> <a target="_blank" href="mailto:saibottob.gatschet@gmail.com"><i class="fas fa-envelope"></i></a></div><div class="footer-personal-info">&copy; Tobias Gatschet 2021</div></footer><script src="main.js"></script></body></html>